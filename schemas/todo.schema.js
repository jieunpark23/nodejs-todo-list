// 1. schema 에서 중요한것 첫번째는 mongoose가 필요하다. 외부에서 mongoose라는 패키지를 코드에 가져와야 해.
import mongoose from "mongoose";

// 2. 실제로 작성되는 schema
// value라는 필드는 우리가 '해야할 일'을 나타내는 거고, order는 '할일의 순서'를 표현, doneAt 는 '완료 날짜'
const TodoSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true, // value 필드는 필수 요소입니다.
  },
  order: {
    type: Number,
    required: true, // order 필드 또한 필수 요소입니다.
  },
  doneAt: {
    type: Date, // doneAt 필드는 Date 타입을 가집니다.
    required: false, // doneAt 필드는 필수 요소가 아닙니다. 왜냐하면 완료가 되지 않았을때도 null 이 들어가야 하기 때문
  },
});

// 프론트엔드 서빙을 위한 코드입니다. 모르셔도 괜찮아요!
TodoSchema.virtual("todoId").get(function () {
  return this._id.toHexString();
});
TodoSchema.set("toJSON", {
  virtuals: true,
});

// TodoSchema를 바탕으로 Todo 모델을 생성하여, 외부로 내보냅니다.
export default mongoose.model("Todo", TodoSchema);
