$(document).ready(() => {
    checkOnline()
    
    window.addEventListener("mousedown", (e) => {
        if (e && e.altKey) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            return false
        }
    })
    window.addEventListener("mouseup", (e) => {
        if (e && e.altKey) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            let target = e.target
            console.log(target, target.currentSrc)
            if (target && !target.currentSrc) {
                const imgs = $(target).find('img')
                if (imgs && imgs.length > 0) {
                    target = imgs[0]
                }
                console.log(target, target.currentSrc)
            }
            if (target && !target.currentSrc) {
                const imgs = $(target).parent().find('img')
                if (imgs && imgs.length > 0) {
                    target = imgs[0]
                }
                console.log(target, target.currentSrc)
            }
            if (target && target.currentSrc) {
                $(target).parent().children('.ok-loading').remove()
                const loading = $('<div class="ok-loading"></div>')
                loading.css('width', 'fit-content')
                loading.css('position', 'absolute')
                loading.css('padding', '4px')
                loading.css('left', '0px')
                loading.css('top', '0px')
                loading.css('z-index', $(target).css('z-index'))
                loading.css('color', 'white')
                loading.text('正在保存')
                loading.css('background', '#cccccc80')
                $(target).parent().append(loading)

                chrome.runtime.sendMessage({
                    action: 'download',
                    url: target.currentSrc,
                    width: target.width,
                    height: target.height
                }, response => {
                    console.log(response)
                    if (response.error) {
                        download({ error: response.error, loading: loading })
                    } else {
                        download({ target: target, loading: loading })
                    }
                })
            } else {
                download({ error: '无法检测到图片' })
            }
            return false
        }
    })
    window.addEventListener("click", (e) => {
        if (e && e.altKey) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            return false
        }
    })
})

let isRunning = false
let queue = []

function download({ target, loading, error }) {
    if (isRunning) {
        queue.push({ target, loading, error })
        return
    }
    isRunning = true
    const container = $('<div class="ok-container ok-card ok-float"><div class="ok-left"><img width="100%" height="100%" class="ok-img" /></div><div class="ok-space"></div><div class="ok-right"><div class="ok-status"></div><a class="ok-open">打开目录</a></div></div>')
    if (target && target.currentSrc) container.find('.ok-img').attr('src', target.currentSrc)
    container.find('.ok-open').click((e) => {
        console.log('ok-open', e)
        chrome.runtime.sendMessage({ 
            action: 'showDefaultDirectory'
        })
    })
    if (error) {
        container.find('.ok-status').text(error)
        container.find('.ok-status').css('color', '#fa5151')
        container.find('.ok-img').css('background-color', '#aaa')
        container.find('.ok-img').css('border-radius', '8px')
        if (loading) loading.text('保存失败')
        if (loading) loading.css('background', '#fa515180')
    } else {
        container.find('.ok-status').text('保存成功')
        container.find('.ok-status').css('color', '#06ae56')
        if (loading) loading.text('保存成功')
        if (loading) loading.css('background', '#06ae5680')
    }
    $('body').append(container)

    const complete = () => {
        setTimeout(() => container.remove(), 3000)

        isRunning = false
        queue.pop()
        if (queue.length > 0) download(queue[0])
    }
    
    if (target) {
        const animeTarget = $('<img class="ok-anime-img" src="' + target.currentSrc + '" />')
        animeTarget.attr('width', $(target).width())
        animeTarget.attr('height', $(target).height())
        animeTarget.attr('object-fit', 'contain')
        animeTarget.css('position', 'absolute')
        animeTarget.css('left', $(target).offset().left + 'px')
        animeTarget.css('top', $(target).offset().top + 'px')
        animeTarget.css('z-index', 2147483647)
        $('body').append(animeTarget)

        animeTarget.animate({
            width: '48px', 
            height: '48px',
            left: $('.ok-img').offset().left + 'px', 
            top: $('.ok-img').offset().top + 'px'
        }, 'normal', 'linear', () => {
            complete()
            animeTarget.remove()
        })
    } else {
        complete()
    }
}

const checkOnline = () => {
    const okOnlineStatus = $('<div class="ok-online-status ok-float"></div>')
    $('body').append(okOnlineStatus)
    chrome.runtime.sendMessage({
        action: 'checkOnline',
    }, (response) => {
        if (response && response.online) {
            okOnlineStatus.css('background', '#4caf50')
        } else {
            okOnlineStatus.css('background', '#f44336')
        }
    })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const okOnlineStatus = $('.ok-online-status')
    if (request.action === 'checkOnline') {
        if (request.online) {
            okOnlineStatus.css('background', '#4caf50')
        } else {
            okOnlineStatus.css('background', '#f44336')
        }
        sendResponse('Received checkOnline')
    }
})