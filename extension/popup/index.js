document.addEventListener("DOMContentLoaded", function() {
    console.log("DOMContentLoaded")

    const okDirValue = document.querySelector('.ok-dir-value')
    chrome.storage.local.get('defaultDirectory', (result) => {
        console.log(result)
        if (result && result.defaultDirectory) {
            okDirValue.innerHTML = result.defaultDirectory
        } else {
            okDirValue.innerHTML = '~\\Downloads'
        }
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