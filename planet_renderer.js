/* Lightweight WebGL renderer for the two user-supplied NASA GLB planet models.
 * The geometry/UVs are baked to planet_mesh.js; textures come from the GLBs.
 * No CDN or external libraries. The original GLB files are also included. */
(function(){
 'use strict';
 const canvas=document.createElement('canvas'); canvas.width=canvas.height=512;
 let gl=null,program=null,positionLoc,normalLoc,uvLoc,uSpin,uTexture;
 const models={};
 const source=window.NASAMeshes||{};
 const result={ready:false,available:false,canvas, render};
 window.NASAPlanetRenderer=result;
 try{
   gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true,preserveDrawingBuffer:true,premultipliedAlpha:false});
   if(!gl||!source.earth||!source.mars)return;
   const vs=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUv;
    uniform float uSpin;varying vec2 vUv;varying float vLight;
    void main(){
       float c=cos(uSpin),s=sin(uSpin);
       mat3 rot=mat3(c,0.,-s, 0.,1.,0., s,0.,c);
       vec3 p=rot*aPosition;
       vec3 n=normalize(rot*aNormal);
       vUv=vec2(aUv.x, 1.0 - aUv.y);
       vLight=0.21+0.80*max(dot(n,normalize(vec3(-0.52,0.58,0.92))),0.);
       gl_Position=vec4(p.x*0.91,p.y*0.91,-p.z*0.72,1.);
    }`;
   const fs=`precision mediump float;uniform sampler2D uTexture;
    varying vec2 vUv;varying float vLight;
    void main(){vec4 tex=texture2D(uTexture,vUv);gl_FragColor=vec4(tex.rgb*vLight,1.);}`;
   const compile=(kind,src)=>{const sh=gl.createShader(kind);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));return sh};
   program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
   gl.useProgram(program);
   positionLoc=gl.getAttribLocation(program,'aPosition');normalLoc=gl.getAttribLocation(program,'aNormal');uvLoc=gl.getAttribLocation(program,'aUv');
   uSpin=gl.getUniformLocation(program,'uSpin');uTexture=gl.getUniformLocation(program,'uTexture');
   for(const name of ['earth','mars']){
     const data=source[name],model={loaded:false,indexCount:data.indices.length};
     function buffer(target,items,ctor){const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,new ctor(items),gl.STATIC_DRAW);return b;}
     model.vertex=buffer(gl.ARRAY_BUFFER,data.vertices,Float32Array);
     model.normal=buffer(gl.ARRAY_BUFFER,data.normals,Float32Array);
     model.uv=buffer(gl.ARRAY_BUFFER,data.uv,Float32Array);
     model.faces=buffer(gl.ELEMENT_ARRAY_BUFFER,data.indices,Uint16Array);
     model.texture=gl.createTexture();
     const img=new Image();img.onload=()=>{
       gl.bindTexture(gl.TEXTURE_2D,model.texture);
       gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
       gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
       gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
       gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
       gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
       model.loaded=true;
       result.ready=Object.values(models).every(m=>m.loaded);
     };
     img.src='assets/nasa_planets/'+name+'_texture.jpg';models[name]=model;
   }
   gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
   result.available=true;
 }catch(e){console.warn('NASA 3D planet renderer unavailable; 2D fallback retained.',e)}
 function render(name,spin){
   const model=models[name];if(!gl||!model?.loaded)return false;
   gl.viewport(0,0,canvas.width,canvas.height);
   gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.useProgram(program);gl.uniform1f(uSpin,spin);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,model.texture);gl.uniform1i(uTexture,0);
   for(const [index,buf,len] of [[positionLoc,model.vertex,3],[normalLoc,model.normal,3],[uvLoc,model.uv,2]]){
     gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.vertexAttribPointer(index,len,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(index);
   }
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.faces);
   gl.drawElements(gl.TRIANGLES,model.indexCount,gl.UNSIGNED_SHORT,0);
   return true;
 }
})();
