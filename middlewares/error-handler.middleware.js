// 에러 핸들링 미들웨어
export default (err, req, res, next) => {
  // console.log("에러처리 미들웨어가 실행되었습니다."); // 잘 작동하는지 확인하려고 적음
  console.error(err);

  // joi에서 발생된 에러라면 status 400
  if (err.name === "ValidationError") {
    return res.status(400).json({ errorMessage: err.message });
  }

  return res
    .status(500)
    .json({ errorMessage: "서버에서 에러가 발생했습니다." });
};

/** err, res, req, next 인자 4개 -> err 객체를 전달받음으로써
 * 1. 에러를 콘솔로 찍고
 * 2. joi에러 일때에는 joi에러를 발생시키고
 * 3. 외부에서 발생되면 서버에서 에러가 발생했다 출력
 *
 * -> 각각의 api에서 처리해야 하는거를 에러 처리 미들웨어로 통합적으로 처리함 -> 이제 app.js에 등록하러 감 -> catch 뒤에 next(error); 실행
 */
