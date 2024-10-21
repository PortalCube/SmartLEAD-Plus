const targetDomains = ["smartlead.hallym.ac.kr"];
const blockUrls = [
    "csms-ai.s3.ap-northeast-2.amazonaws.com/js/react.js",
    "s3.ap-northeast-2.amazonaws.com/code.coursemos.co.kr/lc/learningChecker-v2-amd.js",
];

const blockRules: chrome.declarativeNetRequest.Rule[] = blockUrls.map(
    (item, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: chrome.declarativeNetRequest.RuleActionType.BLOCK },
        condition: {
            initiatorDomains: targetDomains,
            urlFilter: "||" + item,
            resourceTypes: [
                chrome.declarativeNetRequest.ResourceType.SCRIPT,
                chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            ],
        },
    })
);

// 스크립트 차단 해제
export async function deactiveBlockRules() {
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map((rule) => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
    });
}

// 스크립트 차단
export async function activeBlockRules() {
    const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
    const oldRuleIds = oldRules.map((rule) => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: oldRuleIds,
        addRules: blockRules,
    });
}
