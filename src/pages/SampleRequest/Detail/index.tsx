import SampleRequestForm from '../Form'

/** 申请单详情：复用主表单的只读模式，迁自公司模板 `src/pages/SampleRequest/Detail/index.jsx`。 */
export default function SampleRequestDetail() {
  return <SampleRequestForm readOnly requireId />
}
