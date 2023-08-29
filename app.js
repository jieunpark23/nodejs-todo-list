// express를 가져오고 다른 모듈을 연결
// <라우터를 연결하는 법 (1.2.)>
// 1. todosRouter라는 이름으로 가져오고 routes라는 폴더에 todos.router.js파일 을 가져옴
import express from "express";
import connect from './schemas/index.js';
import todosRouter from './routes/todos.router.js';
import errorHandlerMiddleware from './middlewares/error-handler.middleware.js';

const app = express();
const PORT = 3000;

connect();

// Express에서 req.body에 접근하여 body 데이터를 사용할 수 있도록 설정합니다.
app.use(express.json()); // 미들웨어1
app.use(express.urlencoded({ extended: true })); // 미들웨어2

// static Middleware, express.static()을 사용하여 정적 파일을 제공합니다. assets을 파싱하는
app.use(express.static('./assets')); // 미들웨어3

// 미들웨어4
app.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl, ' - ', new Date());
  next();
});

const router = express.Router();

router.get('/', (req, res) => {
  return res.json({ message: 'Hi!' });
});

// 미들웨어5
// 2. app.use('/api', ) 여기에 todosRouter를 추가하면서 배열로 변경해서 넣음. 현재 해당하는 라우터에 등록했다.
// /api 주소로 접근하였을 때, 오른쪽의 라우터 router와 TodosRouter로 클라이언트의 요청이 전달됩니다.
app.use('/api', [router, todosRouter]);

// 에러 처리 미들웨어를 등록
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
