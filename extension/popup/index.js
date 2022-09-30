document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded")

    const okHeaderStatus = document.querySelector('.ok-header-status')
    chrome.runtime.sendMessage({
        action: 'checkOnline',
    }, (response) => {
        if (response && response.online) {
            okHeaderStatus.style.background = '#4caf50'
        } else {
            okHeaderStatus.style.background = '#f44336'
        }
    })

    const okDirValue = document.querySelector('.ok-dir-value')
    const okTypeValueSwitch = document.querySelector('.ok-type-value .switch-input')
    chrome.storage.local.get(['defaultDirectory', 'imageType'], (result) => {
        if (result && result.defaultDirectory) {
            okDirValue.innerHTML = result.defaultDirectory
        } else {
            okDirValue.innerHTML = '未设置'
        }
        okTypeValueSwitch.checked = result && result.imageType
    })
    const okTypeValue = document.querySelector('.ok-type-value')
    okTypeValue.addEventListener('click', async () => {
        chrome.storage.local.set({ 
            'imageType': okTypeValueSwitch.checked ? 'png' : null
        })
    })

    const okChangeDir = document.querySelector('.ok-change-dir')
    okChangeDir.addEventListener('click', async () => {
        chrome.runtime.sendMessage({
            action: 'changeDefaultDirectory'
        }, (response) => {
            if (response && response.defaultDirectory) {
                chrome.storage.local.set({ 'defaultDirectory': response.defaultDirectory }, () => {
                    okDirValue.innerHTML = response.defaultDirectory
                })
            }
        })
        return true
    })
})