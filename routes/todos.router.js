// 1. 라우터를 만드려면 express 에서 라우터를 받아오고 , 2. 해당하는 router를 todos.router.js파일에서 3. 외부로 전달을 해주고
// 4. 그 다음에는 app.js에서 불러오는 방식으로 구현한다.
import express from 'express';
import joi from "joi";
import Todo from "../schemas/todo.schema.js";

// 2. router 생성 (변수 router)
const router = express.Router();

/****할 일 생성 API 유효성 검사 요구사항**
1. `value` 데이터는 **필수적으로 존재**해야한다.
2. `value` 데이터는 **문자열 타입**이어야한다.
3. `value` 데이터는 **최소 1글자 이상**이어야한다.
4. `value` 데이터는 **최대 50글자 이하**여야한다.
5. 유효성 검사에 실패했을 때, 에러가 발생해야한다.
 */
// 실제로 joi 스키마 구현 createdTodoSchema의 경우에는 object를 이용해서 검증진행, 그 object 안에 value라는 키를 바탕으로 검증한다.
const createdTodoSchema = joi.object({
  value: joi.string().min(1).max(50).required(),
});

/*** 할일 등록 API */
// API를 구현할 때는 해당하는 router를 바탕으로 구현하기 때문에 router.post 우리가 구현할 건 어떤 걸 생성할거라는 http 메서드를 사용
// 사용하는 url은 /todos 이고, 데이터베이스를 사용할 거기 때문에 앞에 async를 붙임.
// 왜냐하면 데이터베이스를 조회하는 시간동안 해당하는 프로그램이 멈출수도 있게됨 만약에 async를 사용하지 않고 조회하면, 정상적인 데이터가 조회되지 않을 수도 있음.
// 그래서 async await를 바탕으로 구현 (node.js의 특징이 비동기를 동기적으로 만드는)
router.post("/todos", async (req, res, next) => {
  try {
    // //1. 클라이언트로부터 받아온 value 데이터를 가져온다.
    // // 우리가 구현할 거는 할일 등록 API 그리고 post 메서드를 사용했기 때문에 우리는 req.body를 가져와야 함.
    // const {value} = req.body;

    // ** 할일생성 API 유효성 검사  -> 검증을 진행할 거를 위에 req.body자체로 진행할 것. 왜냐하면 req.body가 객체 형태라서
    const validation = await createdTodoSchema.validateAsync(req.body);

    const { value } = validation;

    // 데이터 유효성 검사 (validation)를 추가
    // 1-5. 만약, 클라이언트가 value 데이터를 전달하지 않았을 때 (비어있거나 undefined), 클라이언트에게 에러 메시지를 전달한다.
    // 400 : 클라이언트가 잘못했다  / json형태로 errorMessage : "해야할 일~ 존재하지 않습니다." 반환
    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: "해야할 일(value) 데이터가 존재하지 않습니다." });
    }

    //2. 해당하는 마지막 order 데이터(order 값이 가장 큰 데이터)를 조회한다.
    // Todo라는 컬렉션에서 (todo.schema.js의 몽구스 모델로 만들어서 외부로 전달 => 위에 import Todo라는 하나의 모델을 가져오도록하고, 그리고 상대경로를 가져옴 ../schemas/todo.schema.js )
    // .findOne() 메서드 = 1개의 데이터만 조회한다.
    // sort = 정렬한다. -> 어떤 컬럼을? order라는 컬럼을 (필드를) 기준으로 -order : 내림차순 / order: 오름차순
    // .exec() 맨 마지막에 써야 함. 몽구스를 조회하는 맨 마지막에는 exec()를 붙이면 깔끔하게 사용할 수 있다로 해석 / exec() 붙이지 않으면 앞에 있는 구문들이 Promise로 동작하지 않게 됨.(= 앞에 있는 await을 사용할 수 없다고 생각) 몽구스에 동작을 보냈지만, 데이터가 언제 올지 확실해지지 않는다로 이해
    // .exec()에 cmd + 클릭 누르면 어떤게 반환되는지 볼 수 있음. Promise로 반환 > await을 붙이지 않아도 promise로 조회
    const todoMaxOrder = await Todo.findOne().sort("-order").exec();

    //3. 만약 todoMaxOrder 존재한다면 현재 해야 할 일을 +1하고, order 데이터가 존재하지 않다면, 1로 할당한다.
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    //4. 해야할 일 등록
    // 해야할 일은 todo라는 변수에 할당할 거고, new Todo() 라고 하면, 하나의 데이터를 생성할 수 있음. 생성할 데이터는 {value, ordeer}
    // todo를 새 Todo 인스턴스(객체) 형식으로 만듬
    // await todo.save() 를 작성해야만, 실제로 데이터베이스 형태로 저장한다.
    const todo = new Todo({ value, order });
    await todo.save();

    //5. 해야할 일을 클라이언트에게 반환한다.
    // .status(201) 정상 등록
    // 반환하는 데이터를 todo라는 키에다가 todo 데이터를 할당할거다.(위에)
    return res.status(201).json({ todo: todo });
  } catch (error) {
    // Router 다음에 있는 에러 처리 미들웨어를 실행한다.
    next(error);
  }
});

/** 해야할 일 목록 조회 API */
//api 등록할 때는 router에 등록하고, 조회하는 거라 메서드는 get메서드. 해당하는 경로는 /todos 사용.
//현재 코드 내부에서  데이터베이스를 접근하는 것처럼 비동기적으로 접근해야해서 async . 3가지 인자 next는 안적어도 되지만, 리팩토링 작업을 해야할 수도 있어서 붙임.
router.get("/todos", async (req, res, next) => {
  // 1. 해야할 일 목록 조회를 진행한다.
  //해야할 일 목록 데이터를 todos라는 변수에 할당을 하고, await 데이터베이스가 뒤에 코드를 실행하는 동안 기다린 다음에 다음코드를 실행한다.
  //todo.schema.js에서 반환한 Todo모델. moongose 연결 Todo 에서 찾는다. 내림차순으로 그리고 await exec()는 항상 붙여서 생각
  // .find() - 여러개의 데이터를 조회한다.
  // .sort('-order') - order라는 필드값을 내림차순으로 해서
  const todos = await Todo.find().sort("-order").exec();

  // 2. 해야할 일 목록 조회 결과를 클라이언트에게 반환한다.
  // todos 라는 키에다가 위에 todos라는 변수를 할당한다. 같으면 하나만 적어도 됨. 객체 축약 표현
  return res.status(200).json({ todos });
});

/** 해야할 일 순서 변경 + 완료/해제 API + 할일 내용 변경 API **/
// 변경을 patch 메서드를 사용해서 변경하고, /todos/:todoId 를 경로로 확인할거다.
// /:todoId라는 경로매개변수는 어떤 해야할 일을 수정해야할지 알기 위해서 사용
// 인자에 next는 미들웨어가 나오게 되면, 미들웨어로 전달해주기 위한 내용으로 알면 돼.
router.patch("/todos/:todoId", async (req, res, next) => {
  //어떤 할일을 변경할지 알아야하기 때문에 {todoId}를 가져옴. 경로매개변수에서 가져오기 때문에 request에 있는 params에 들어있는 todoId를 가져옴
  //두번째로는 순서를 변경해야하기 때문에 {order} 라고 하는 값을 request에 있는 body에서 가져옴
  const { todoId } = req.params;
  const { order, done, value } = req.body;

  // 현재 지금 나의 order가 무엇인지 알아야 한다.
  // currentTodo라는 데이터를 하나 만듬. Todo모델을 바탕으로 조회를 할건데,
  // .findById() 메서드를 통해 todoId에 해당하는 걸 가져와서 현재todo에 대한걸 조회한다. 몽구스에서 특정 데이터를 조회할 때는 exec()를 붙인다.
  const currentTodo = await Todo.findById(todoId).exec();
  // error 처리, 해야할 일 정보 조회 ->  만약 현재todo가 존재하지 않으면 error 메시지
  // status(404) - 클라이언트가 잘못한. 클라이언트가 전달한 데이터가 not found 되었다.
  // 그 다음에 클라이언트에게 에러메시지를 전달하기 위해 json() {errorMessage : '존재하지 ~ 입니다.' }
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errroMessage: "존재하지 않는 해야할 일 입니다." });
  }

  // 이제 순서를 변경하는 작업
  // order라는 값이 있을 때에만 한다는 if 조건문 -> 3번을 2번으로 바꾸고자 할 때, 2번 데이터가 이미 존재하는가를 검사
  if (order) {
    // targetTodo라고 하고 await으로 조회를 해서 .findOne() 메서드 - 목록을 조회하는데(find) 하나의 데이터만 조회
    // .findOne({oredr : order}) order키의 위에 order 값을 조회하는데 객체구조분해할당을 통해 하나로만 만듬
    // 데이터를 조회하는 거라 .exec()를 가져오도록 할 것
    const targetTodo = await Todo.findOne({ order }).exec();
    // 근데, 여기서 만약 2번 데이터가 존재하지 않을 경우(이때는 순서변경 안해도 되니까)를 고려해 조건을 검. targetTodo가 존재할 때에만 비즈니스로직을 수행하도록
    if (targetTodo) {
      //이미 현재 존재한다면, 저희가 가지고 있는 값의 order값으로 변경한다고 생각
      targetTodo.order = currentTodo.order;
      // 위에변경한 값을, 실제 데이터 베이스에 저장
      await targetTodo.save();
    }

    //값이 바껴서 저장되었으니, currentTodo()값 또한 똑같이 변경을 해줌.
    // currentTodo의 order 또한 우리가 전달받으려는 order 값으로 구현 -> 위에 const {order} = req.body
    currentTodo.order = order;
  }

  // 완료/해제 조건문 -> done 이 null이나 true 일때, = 만약에 done 만 있으면 true는 들어오지만, false면 들어오지 않게 되는 문제때문에 조건을 이렇게 작성
  if (done !== undefined) {
    // currentTodo라는 데이터의 doneAt이라는 필드를 우리가 지정한 값에 변경할 거, done 값이 존재할 때, true면  현재시간, 존재하지 않으면 false를 넣어준다.
    currentTodo.doneAt = done ? new Date() : null;
  }

  // 할일 수정 조건문 -> value라는 데이터가 있을때에만 실행
  // currentTodo의 value는 전달받은 value로 수정한다.
  if (value) {
    currentTodo.value = value;
  }

  // 이렇게 변경된 후에 최종, 실제 데이터베이스에다가 currentTodo의 {todoId}에 전달받은 해야할 일 또한 데이터베이스에 저장해줌.
  await currentTodo.save();

  // 최종!! json형태로 단순한 {} 객체만 전달하도록 구현
  return res.status(200).json({});
});

/** 할 일 삭제 API */
router.delete("/todos/:todoId", async (req, res, next) => {
  // 먼저 경로매개변수 :todoId라는 값을 가져와야 함. {todoId}라는 변수를 경로매개변수인 request에 있는 params에서 가져온다고 생각
  const { todoId } = req.params;
  // 두번째로 Id값을 찾아왔으니까 이제 그 해야할일을 가져옴
  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: "존재하지 않는 해야할 일 정보입니다." });
  }

  //이제는 실제로 삭제 -> .deleteOne() 메서드 - 하나의 데이터를 삭제. 몽고db는 기본적으로 _id가 todoId에 해당한다
  await Todo.deleteOne({ _id: todoId });

  return res.status(200).json({}); // json으로 아무런 데이터를 전달하지 않음
});

// 3. 생성한 router를 외부로 보냄
export default router;

// 해야할 일 목록조회 API가 제대로 작동하는지 확인하려면 서버를 껐다가 켠 다음에 insomnia에 들어가
// insomnia에 새로운 API를 만듬. GET localhost:3000/api/todos   > 왼쪽에 있는 insomnia내용은 우리가 편하게 확인하도록 작성 /api/todos
// 그 다음에 여기서는 body 데이터를 사용하지 않기 때문에 그냥 바로 send를 보냄  > 해야할 일 목록들이 정상적으로 작동하는 걸 확인할 수 있음.
// post에 가서 좀 더 등록해주고, 다시 get 조회해보면 order 값을 기준으로 정상적으로 내림차순 정렬됨을 확인할 수 있음.

//해야할 일 순서변경 API 메인로직. /:todoId를 바탕으로 currentTodo = 해야할일을 찾고, 해야할 일이 있고, 순서를 전달받았을 때, 현재 순서를 변경을 하고, 변경된 순서를 실제 데이터베이스에 저장한다.
/**잘 작동되는지 insomnia를 켜서 해당 api 확인
 * (PATCH) localhost:3000/api/todos/64ed276052d7e5386270c370 (:todoId)
 * 옆에는 /api/todos/:todoId
 */

/** 삭제 API
 * (DELETE)localhost:3000/api/todos/64ed276052d7e5386270c370
 * 옆에는 /api/todos/:todoId
 */
/** 수정 API
 *
 */
