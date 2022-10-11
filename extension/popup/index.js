$(document).ready(() => {
    $('body').on('click', 'a', function(){
        chrome.tabs.create({url: $(this).attr('href')})
        return false
    })

    chrome.runtime.sendMessage({
        action: 'checkOnline',
    }, (response) => {
        if (response && response.online) {
            $('.ok-header-status').css('background', '#4caf50')
        } else {
            $('.ok-header-status').css('background', '#f44336')
        }
    })

    chrome.storage.local.get(['defaultDirectory', 'imageType'], (result) => {
        if (result && result.defaultDirectory) {
            $('.ok-dir-value').text(result.defaultDirectory)
        } else {
            $('.ok-dir-value').text('未设置')
        }
        $('.ok-type-value .switch-input').attr('checked', result && result.imageType)
    })

    $('.ok-type-value').click(() => {
        chrome.storage.local.set({ 
            'imageType': $('.ok-type-value .switch-input').attr('checked') ? 'png' : null
            
        })
    })

    $('.ok-change-dir').click(() => {
        chrome.runtime.sendMessage({
            action: 'changeDefaultDirectory'
        }, (response) => {
            if (response && response.defaultDirectory) {
                chrome.storage.local.set({ 'defaultDirectory': response.defaultDirectory }, () => {
                    $('.ok-dir-value').text(response.defaultDirectory)
                })
            }
        })
    })
})