let cacheRules = { rule_version: 0 }

function fetchStorageConfig() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('defaultDirectory', (result) => {
            console.log(result)
            if (result && result.defaultDirectory) {
                resolve(result.defaultDirectory)
            } else {
                resolve('~\\Downloads')
            }
        })
    })
}

function fetchAssetsRules() {
    const sieveURL = chrome.runtime.getURL('assets/sieve.json')
    return fetch(sieveURL).then((response) => {
        return response.json()
    }).then(json => {
        console.log('fetchAssetsConfig', json)
        if (json && json.rule_version && 
            cacheRules && cacheRules.rule_version && 
            cacheRules.rule_version < json.rule_version) {
            cacheRules = json;
        }
    })
}

function fetchRemoteRules() {
    const remoteSieveURL = 'https://billfish-resource-oss.oss-cn-hangzhou.aliyuncs.com/extension/sieve.json'
    return fetch(remoteSieveURL).then((response) => {
        return response.json()
    }).then((json) => {
        console.log('fetchRemoteConfig', json)
        if (json && json.rule_version &&
            cacheRules && cacheRules.rule_version && 
            cacheRules.rule_version < json.rule_version) {
            cacheRules = json;
        }
    })
}

function convertSrc(src) {
    if (-1 < src.indexOf('data:image'))
        return src;
    if (cacheRules && cacheRules.rules)
        for (var i = 0; i < cacheRules.rules.length; i++)
            try {
                var rule = cacheRules.rules[i]
                  , srcPattern = rule.srcPattern
                  , replaceRule = rule.replaceRule
                  , reg = RegExp(srcPattern);
                if (reg.test(src)) {
                    var newSrc, script = replaceRule.replace('"@"', 'src');
                    return eval('newSrc = '.concat(script)),
                    newSrc
                }
            } catch (err) {
                return src
            }
    console.log(src)
    return src
}

fetchAssetsRules().then(() => fetchRemoteRules())

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request, sender)
    if (request.action === 'checkRulesUpdate') {
        fetchAssetsRules().then(() => fetchRemoteRules())
    } else if (request.action === 'download') {
        fetchStorageConfig()
            .then((defaultDirectory) => {
                const url = convertSrc(request.url)
                console.log(url)
                let filename = url.split('?')[0].split('/').pop()
                    .replace(/\.png.*/, '.png').replace(/\.jpg.*/, '.jpg')
                    .replace(/\.jpeg.*/, '.jpeg').replace(/\.bmp.*/, '.bmp')
                    .replace(/\.gif.*/, '.gif').replace('\.webp.*', '.webp')
                if (url.includes('huaban.com')) {
                    filename = filename.replace('webp', '.webp')
                }
                const savePath = defaultDirectory + '\\' + filename
                return fetch('http://127.0.0.1:8080/download?save_path=' + savePath + '&url=' + url)
            })
            .then(response => response.json())
            .then(json => {
                console.log(json)
                sendResponse(json)
            })
            .catch(error => {
                console.log(error)
                sendResponse({ error: error.message })
            })
    } else if (request.action === 'changeDefaultDirectory') {
        fetch('http://127.0.0.1:8080/changeDefaultDirectory')
            .then(response => response.json())
            .then(json => {
                console.log(json)
                sendResponse(json)
            })
            .catch(error => {
                console.log(error)
                sendResponse({ error: error.message })
            })
    } else if (request.action === 'showDefaultDirectory') {
        fetchStorageConfig()
            .then((defaultDirectory) => {
                return fetch('http://127.0.0.1:8080/showDefaultDirectory?defaultDirectory=' + defaultDirectory)
            }).then(response => response.json())
            .then(json => {
                console.log(json)
                sendResponse(json)
            })
            .catch(error => {
                console.log(error)
                sendResponse({ error: error.message })
            })
    } else if (request.action === 'checkOnline') {
        fetch('http://127.0.0.1:8080/checkOnline')
            .then((response) => response.json())
            .then((json) => {
                console.log(json)
                sendResponse(json)
            })
            .catch(error => {
                console.log(error)
                sendResponse({ error: error.message })
            })
    }
    return !!request.action
})

setInterval(() => {
    fetch('http://127.0.0.1:8080/checkOnline')
        .then((response) => response.json())
        .then((json) => {
            console.log(json)
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'checkOnline',
                        online: true
                    }, (response) => {
                        console.log(response)
                    })
                }
            })
        })
        .catch(error => {
            console.log(error)
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs.length > 0) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'checkOnline',
                        online: false
                    }, (response) => {
                        console.log(response)
                    })
                }
            })
        })
}, 5000)
