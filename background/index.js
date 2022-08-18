let sieveURL = chrome.runtime.getURL("assets/sieve.json")
  , remoteSieveURL = "https://billfish-resource-oss.oss-cn-hangzhou.aliyuncs.com/extension/sieve.json"
  , cacheRules = {}
  , cacheRulesJSON = localStorage.getItem("cacheRules");
try {
    cacheRulesJSON ? cacheRules = JSON.parse(cacheRulesJSON) : fetchSieve()
} catch (err) {}

function fetchSieve() {
    fetch(sieveURL).then(function(D) {
        return D.json()
    }).then(function(D) {
        D && D.rule_version && (cacheRules && cacheRules.rule_version && cacheRules.rule_version < D.rule_version ? (cacheRules = D,
        localStorage.setItem("cacheRules", JSON.stringify(cacheRules))) : cacheRules && cacheRules.rule_version || (cacheRules = D,
        localStorage.setItem("cacheRules", JSON.stringify(D))))
    })
}

function checkRuleUpdates() {
    fetch(remoteSieveURL).then(function(D) {
        return D.json()
    }).then(function(D) {
        D && D.rule_version && cacheRules && cacheRules.rule_version && cacheRules.rule_version < D.rule_version && (cacheRules = D,
        localStorage.setItem("cacheRules", JSON.stringify(cacheRules)))
    })
}

function convertSrc(src) {
    if (-1 < src.indexOf("data:image"))
        return src;
    if (cacheRules && cacheRules.rules)
        for (var i = 0; i < cacheRules.rules.length; i++)
            try {
                var rule = cacheRules.rules[i]
                  , srcPattern = rule.srcPattern
                  , replaceRule = rule.replaceRule
                  , reg = RegExp(srcPattern);
                if (reg.test(src)) {
                    var newSrc, script = replaceRule.replace("'@'", "src");
                    return eval("newSrc = ".concat(script)),
                    newSrc
                }
            } catch (err) {
                return src
            }
    console.log(src)
    return src
}

checkRuleUpdates()

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request, sender)
    if (request.action === 'download') {
        chrome.downloads.download({ 
            url: convertSrc(request.url)
        }, (downloadId) => {
            sendResponse({ downloadId })
        })
        return true
    } else if (request.action == 'open') {
        chrome.downloads.showDefaultFolder()
        return true
    }
    return false
})

chrome.downloads.onChanged.addListener((downloadId) => {
    if (!downloadId.state) return
    if (downloadId.state.current === 'complete') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { success: true, id: downloadId.id })
        })
    } else if (downloadId.state.current === 'interrupted') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { success: false, id: downloadId.id })
        })
    }
})