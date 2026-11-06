import WorkflowApprovePage from '../../../components/WorkflowApprovePage'
import { getIntl } from '../../../utils/intl'
import '../workflow-example.css'
import WorkflowExampleForm from '../Form'

/**
 * 流程审批办理页（薄壳）。
 *
 * 参照公司模板 `src/pages/Project/ProjectApply/approve/*` 的做法：
 * 审批页只负责把业务主表单交给 `WorkFlow.Approve`，单据字段与校验仍在主表单里。
 */
export default function WorkflowExampleApprove() {
  const { formatMessage: t } = getIntl()

  return (
    <WorkflowApprovePage
      mainComponent={WorkflowExampleForm}
      missingParamMessage={t({ id: 'workflowExample.missingId' })}
      bizTabTitle={t({ id: 'workflowExample.page' })}
      className="workflow-example-approve"
    />
  )
}
