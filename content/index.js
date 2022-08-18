const divs = {}
$(document).ready(() => {
    window.addEventListener("mousedown", (e) => {
        if (e && e.altKey) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            console.log(e.target)
            if (e.target && e.target.currentSrc) {
                chrome.runtime.sendMessage({
                    action: 'download',
                    url: e.target.currentSrc
                }, (response) => {
                    console.log('download', response)
                    if (response && response.downloadId) {
                        divs[response.downloadId] = e.target
                    } else {
                        divs[-1] = null
                        pop({ success: false, downloadId: { id: -1 } })
                    }
                })
            } else {
                divs[-1] = null
                pop({ success: false, downloadId: { id: -1 } })
            }
            return false
        }
    })
    window.addEventListener("mouseup", (e) => {
        if (e && e.altKey) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
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
let popQueue = []
function pop(request) {
    if (isRunning) {
        popQueue.push(request)
        return
    }
    isRunning = true
    const target = divs[request.id]
    const container = $('<div class="ok-container ok-card"><div class="ok-left"><img width="100%" height="100%" class="ok-img" /></div><div class="ok-space"></div><div class="ok-right"><div class="ok-status"></div><a class="ok-open">打开目录</a></div></div>')
    if (target && target.currentSrc) container.find('.ok-img').attr('src', target.currentSrc)
    container.find('.ok-open').click((e) => {
        console.log('ok-open', e)
        chrome.runtime.sendMessage({ 
            action: 'open'
        })
    })
    container.addClass('.' + request.id)
    $('body').append(container)

    const complete = () => {
        console.log('append')
        container.css('opacity', 1)

        if (request.success) {
            $('.ok-status').text('保存成功')
            $('.ok-status').css('color', '#06ae56')
        } else {
            $('.ok-status').text('保存失败')
            $('.ok-status').css('color', '#fa5151')
        }

        setTimeout(() => {
            console.log('remove')
            container.remove()
        }, 3000)

        isRunning = false
        popQueue.pop()
        divs[request.id] = null
        if (popQueue.length > 0) {
            pop(popQueue[0])
        }
    }

    if (target) {
        const imgOffset = $('.ok-img').offset()
        const targetOffset = $(target).offset()
        const a = anime({
            targets: [target],
            scale: 48 / target.width,
            translateX: imgOffset.left - targetOffset.left,
            translateY: imgOffset.top - targetOffset.top,
            opacity: 0,
            duration: 500,
            easing: 'easeInOutQuad',
            complete: () => {
                complete()
                a.reset()
                $(target).css('opacity', 0.5)
            }
        })
    } else {
        complete()
    }
        
}

chrome.extension.onMessage.addListener((request, sender) => {
    console.log('content', request, sender)
    pop(request)
})
