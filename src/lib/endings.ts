import { EndingDetail, GameState } from './types';
import { Physics } from './physics';

export function getEndingDetails(state: GameState): EndingDetail {
  const m = state.mission;
  const reason = m.reason || '';

  if (m.result === 'success') {
    const score = m.score;
    const cap = Physics.photoCapacity(state.slot[0], state.slot[4]);
    const target = cap.targetPhotos;
    const distinct = new Set(state.sat.returned.map((r) => r.region)).size;
    if (score >= 90 && distinct >= Math.min(4, target) && state.sat.returned.length >= target) {
      return {
        id: 'discovery',
        headline: 'GOOD ENDING · SCIENTIFIC DISCOVERY',
        name: 'Đột phá khoa học',
        badge: 'EXCEPTIONAL',
        analysis:
          'Tàu vào quỹ đạo chính xác, tiết kiệm nguồn lực và gửi ảnh từ bốn vùng địa hình. Dữ liệu khoa học vượt chỉ tiêu ban đầu.',
        advice: 'Bạn đã tối ưu hóa thiết kế, quá trình bay và sản lượng khoa học.',
      };
    }
    if (score >= 78) {
      return {
        id: 'nominal',
        headline: 'GOOD ENDING · MISSION ACCOMPLISHED',
        name: 'Nhiệm vụ hoàn thành',
        badge: 'MISSION SUCCESS',
        analysis:
          'Các hệ thống chính còn hoạt động, vệ tinh đã ổn định tại quỹ đạo yêu cầu và gửi đủ ảnh về Trái Đất.',
        advice: 'Có thể cải thiện độ chính xác quỹ đạo, nhiên liệu dự phòng và phạm vi quan sát.',
      };
    }
    return {
      id: 'survival',
      headline: 'GOOD ENDING · NARROW SUCCESS',
      name: 'Thành công trong gang tấc',
      badge: 'MINIMUM OBJECTIVES MET',
      analysis:
        'Đạt mục tiêu truyền ảnh nhưng còn ít nhiên liệu hoặc sai số quỹ đạo đáng kể. Các mục tiêu tối thiểu được xác nhận.',
      advice: 'Thử quỹ đạo chính xác hơn và chọn linh kiện phù hợp để tăng điểm.',
    };
  }

  const checks: [RegExp, string, string, string][] = [
    [
      /lực đẩy|TWR|bệ phóng|rời bệ/i,
      'LAUNCH ABORT',
      'TWR thấp hoặc sai chế độ động cơ khiến tên lửa không thể cất cánh.',
      'Chọn tên lửa phù hợp với tải trọng và tăng throttle đủ để TWR > 1.',
    ],
    [
      /Max Q|khung tên lửa|khí động|quá tải/i,
      'STRUCTURAL BREAKUP',
      'Tải trọng khí động vượt khả năng kết cấu, có thể do lệch pitch/roll hoặc lực đẩy quá mạnh tại vùng khí quyển đặc.',
      'Duy trì pitch/roll gần giá trị hướng dẫn và giảm throttle quanh Max Q.',
    ],
    [
      /hành lang phóng|lệch quá xa|Sai hướng phóng|rời hành lang/i,
      'ASCENT GUIDANCE LOSS',
      'Lực đẩy, nhiên liệu hoặc hướng điều khiển không cho phép đạt hành lang phóng an toàn.',
      'Giữ lực đẩy đủ cao, chọn phương tiện phù hợp và hạn chế lệch hướng.',
    ],
    [
      /tầng trên|CENTAUR|TMI|Trans-Mars|quỹ đạo chờ/i,
      'EARTH DEPARTURE FAILURE',
      'Đốt tầng trên không đủ hoặc vượt giới hạn, khiến quỹ đạo chờ/chuyển tiếp không đạt điều kiện.',
      'Kiểm tra dự trữ nhiên liệu Centaur và chọn Δv/góc đốt gần hướng dẫn.',
    ],
    [
      /bay lệch|điểm tiếp cận|lướt qua sao hỏa/i,
      'MARS FLYBY',
      'Sai số hiệu chỉnh hành trình quá lớn; tàu đi ngang qua Sao Hỏa mà không thể bắt vào quỹ đạo.',
      'Giảm sai lệch along-track/cross-track; chú ý nhiên liệu cho các hiệu chỉnh tiếp theo.',
    ],
    [
      /Nhiệt độ|hãm khí quyển|aerobraking|periapsis/i,
      'ATMOSPHERIC OVERHEAT',
      'Quỹ đạo hãm khí quyển quá thấp làm tăng tải nhiệt, đặc biệt với cấu hình cánh pin lớn.',
      'Sử dụng periapsis an toàn (thường 140–165 km trong game), hoặc thay đổi cấu hình năng lượng.',
    ],
    [
      /nguồn điện|mất điện|pin cạn|năng lượng/i,
      'SPACECRAFT BLACKOUT',
      'Không có năng lượng duy trì các hệ thống sống còn. Thiếu điện có thể do chưa mở cánh pin, vùng tối hoặc linh kiện quá tải.',
      'Triển khai cánh pin ngay sau tách MRO, giữ pin dự phòng và cân bằng tiêu thụ điện.',
    ],
    [
      /nhiên liệu|propellant|cạn/i,
      'PROPELLANT EXHAUSTION',
      'Nhiên liệu đã không đủ để thực hiện phần Δv yêu cầu, nên vệ tinh không thể tiếp tục nhiệm vụ.',
      'Chọn bình chứa phù hợp, hạn chế burn không cần thiết và dùng aerobraking hiệu quả.',
    ],
    [
      /sai mục tiêu|quỹ đạo sai|quỹ đạo khoa học/i,
      'ORBITAL INSERTION ERROR',
      'Độ cao hoặc độ nghiêng quỹ đạo cuối vượt giới hạn nghiệm thu của nhiệm vụ.',
      'Đối chiếu Δv circularization với viễn điểm hiện tại và chọn nghiêng gần 93°.',
    ],
    [
      /sao hỏa|Mars Orbit|MOI|bắt vào quỹ đạo/i,
      'MARS CAPTURE FAILURE',
      'Đốt hãm tốc sai khiến tàu không bị Sao Hỏa giữ lại hoặc đi vào vùng quỹ đạo nguy hiểm.',
      'Dành đủ nhiên liệu cho MOI và giữ Δv, góc đốt trong hành lang an toàn.',
    ],
    [
      /ăng.ten|tín hiệu|truyền dữ liệu/i,
      'COMMUNICATIONS LOSS',
      'Vệ tinh không thể gửi dữ liệu về Trái Đất dù đã đến được Sao Hỏa.',
      'Kiểm tra ăng-ten, nguồn điện và xung đột điện từ radar.',
    ],
  ];

  for (const [pattern, id, analysis, advice] of checks) {
    if (pattern.test(reason)) {
      return {
        id,
        headline: 'BAD ENDING · ' + id,
        name: id,
        badge: 'MISSION FAILURE',
        analysis,
        advice,
      };
    }
  }

  return {
    id: 'mission-loss',
    headline: 'BAD ENDING · MISSION LOSS',
    name: 'Nhiệm vụ thất bại',
    badge: 'SYSTEM FAILURE',
    analysis:
      'Một điều kiện bay hoặc vận hành thiết yếu không được thỏa mãn. Hệ thống đã chấm dứt nhiệm vụ.',
    advice: 'Xem lại sự kiện cuối cùng, chọn cấu hình khác và kiểm tra các mốc an toàn.',
  };
}
