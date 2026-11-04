import {http, HttpResponse} from 'msw'
import {t} from './messages'

export const PROTOTYPE_BPM_BASE = `${import.meta.env.BASE_URL}prototype-bpm`
const api = `*/prototype-bpm/sei-bpm/runDefaultBpm`
const ok = (data: unknown) => HttpResponse.json({success: true, data})

/** 只拦截原型专用路径，SUID 流程组件使用的响应均由本机生成。 */
export const sampleRequestBpmHandlers = [
  http.get(`${api}/getApprovePageLoadingInfo`, () => ok({
    businessModelRemark: t('flowSummary'), defaultOpinion: '', opinionList: [], disagreeReasonList: [],
    allowApproveAttachments: false, endNoSecondConfirmation: true,
    executeButtonList: [
      {executeButton: 'AGREE', executeButtonRemark: t('agree')},
      {executeButton: 'DISAGREE', executeButtonRemark: t('disagree'), disagreeChooseReturnOrNot: false},
    ],
  })),
  http.get(`${api}/getNextDicisionInfo`, () => ok([])),
  http.get(`${api}/getMergeTrackInfoByTaskId`, () => ok([])),
  http.post(`${api}/getSelectedNextNodeInfo`, async ({request}) => {
    const body = await request.json() as {agreeOrNot?: boolean}
    return ok([{id: body.agreeOrNot ? 'mock-end' : 'mock-return',
      name: body.agreeOrNot ? t('approved') : t('returned'), nodeType: 'EndEvent', solidifyNode: true}])
  }),
  http.post(`${api}/handleBpmFlow`, async ({request}) => {
    const body = await request.json() as {taskId?: string; buttonCode?: string; opinion?: string}
    if (!body.taskId?.startsWith('mock-task-') || !['AGREE', 'DISAGREE'].includes(body.buttonCode ?? '')) {
      return HttpResponse.json({success: false, message: t('flowUnsupported')})
    }
    if (body.buttonCode === 'DISAGREE' && !body.opinion?.trim()) {
      return HttpResponse.json({success: false, message: t('required')})
    }
    return HttpResponse.json({success: true, message: t('flowDone'), data: {
      flowStatus: body.buttonCode === 'AGREE' ? 'approved' : 'returned',
    }})
  }),
  // 禁止未覆盖的流程能力请求穿透到真实服务。
  http.all('*/prototype-bpm/*', () => HttpResponse.json({success: false, message: t('flowUnsupported')})),
]
