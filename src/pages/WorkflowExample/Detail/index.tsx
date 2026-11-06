import WorkflowExampleForm from '../Form'

/** 费用申请单详情：复用主表单的只读模式。 */
export default function WorkflowExampleDetail() {
  return <WorkflowExampleForm readOnly requireId />
}
