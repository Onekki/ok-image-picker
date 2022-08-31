chrome.runtime.sendMessage({
    action: 'checkRulesUpdate'
})

const divs = {}
$(document).ready(() => {
    $('body').append('<div class="ok-list ok-card ok-float"></div>')
    window.addEventListener("mousedown", (e) => {
        if (e && e.altKey) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            let target = e.target
            console.log(target)
            if (target && !target.currentSrc) {
                const imgs = $(target).find('img')
                if (imgs && imgs.length > 0) {
                    target = imgs[0]
                }
                console.log(target)
            }
            if (target && !target.currentSrc) {
                const imgs = $(target).parent().find('img')
                if (imgs && imgs.length > 0) {
                    target = imgs[0]
                }
                console.log(target)
            }
            if (target && target.currentSrc) {
                chrome.runtime.sendMessage({
                    action: 'download',
                    url: target.currentSrc
                }, response => {
                    console.log(response)
                    if (response.error) {
                        download(response)
                    } else {
                        divs[divs.length] = target
                        download({ id: divs.length })
                    }
                })
            } else {
                download({ error: '无法检测到图片' })
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
let queue = []

function download({ id, error }) {
    if (isRunning) {
        queue.push({ id, error })
        return
    }
    isRunning = true
    const target = divs[id]
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
    } else {
        container.find('.ok-status').text('保存成功')
        container.find('.ok-status').css('color', '#06ae56')
    }
    $('body').append(container)

    const complete = () => {
        setTimeout(() => container.remove(), 3000)

        isRunning = false
        queue.pop()
        divs[id] = null
        if (queue.length > 0) pop(queue[0])
    }

    if (target) {
        const targetOffset = $(target).offset()
        const imgOffset = $('.ok-img').offset()
        console.log($(target).offset(), $('.ok-img').offset())
        const animeTarget = $('<img class="ok-anime-img" src="' + target.currentSrc + '" />')
        animeTarget.attr('width', $(target).width())
        animeTarget.attr('height', $(target).height())
        animeTarget.attr('object-fit', 'contain')
        animeTarget.css('position', 'absolute')
        animeTarget.css('left', targetOffset.left)
        animeTarget.css('top', targetOffset.top)
        animeTarget.css('z-index', 2147483647)
        $('body').append(animeTarget)

        console.log(imgOffset.left - targetOffset.left, imgOffset.top - targetOffset.top)
        animeTarget.animate({
            width: '48px', height: '48px', position: 'absolute',
            left: imgOffset.left + 'px', top: imgOffset.top + 'px'
        }, 'normal', 'linear', () => {
            complete()
            $(target).css('opacity', 0.5)
            animeTarget.remove()
        })
    } else {
        complete()
    }
}
