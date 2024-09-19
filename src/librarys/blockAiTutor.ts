// AI 튜터 스크립트
const blockRules: chrome.declarativeNetRequest.Rule[] = [
    {
        id: 1,
        priority: 1,
        action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
        condition: {
            initiatorDomains: ["smartlead.hallym.ac.kr"],
            urlFilter: "||csms-ai.s3.ap-northeast-2.amazonaws.com/js/react.js",
            resourceTypes: [
                chrome.declarativeNetRequest.ResourceType.SCRIPT,
                chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            ],
        },
    },
];

// AI 튜터 스크립트를 활성화
export async function enableAiTutor() {
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map((rule) => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
    });
}

// AI 튜터 스크립트를 비활성화
export async function disableAiTutor() {
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map((rule) => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: blockRules,
    });
}
