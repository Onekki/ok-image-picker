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

const divs = {}
$(document).ready(() => {
    $('body').append('<div class="ok-list ok-card ok-float"></div>')
    window.addEventListener("mousedown", (e) => {
        if (e && e.altKey) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            console.log(e.target)
            if (e.target && e.target.currentSrc) {
                chrome.runtime.sendMessage({
                    action: 'download',
                    url: convertSrc(e.target.currentSrc)
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
    const container = $('<div class="ok-container ok-card ok-float"><div class="ok-left"><img width="100%" height="100%" class="ok-img" /></div><div class="ok-space"></div><div class="ok-right"><div class="ok-status"></div><a class="ok-open">打开目录</a></div></div>')
    if (target && target.currentSrc) container.find('.ok-img').attr('src', convertSrc(target.currentSrc))
    container.find('.ok-open').click((e) => {
        console.log('ok-open', e)
        chrome.runtime.sendMessage({ 
            action: 'open'
        })
    })
    if (request.success) {
        container.find('.ok-status').text('保存成功')
        container.find('.ok-status').css('color', '#06ae56')
    } else {
        container.find('.ok-status').text('保存失败')
        container.find('.ok-status').css('color', '#fa5151')
        container.find('.ok-img').css('background-color', '#aaa')
        container.find('.ok-img').css('border-radius', '8px')
    }
    $('body').append(container)

    const complete = () => {
        setTimeout(() => container.remove(), 3000)

        isRunning = false
        popQueue.pop()
        divs[request.id] = null
        if (popQueue.length > 0) pop(popQueue[0])
    }

    if (target) {
        const targetOffset = $(target).offset()
        const imgOffset = $('.ok-img').offset()
        console.log($(target).offset(), $('.ok-img').offset())
        const animeTarget = $('<img class="ok-anime-img" src="' + convertSrc(target.currentSrc) + '" />')
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

chrome.extension.onMessage.addListener((request, sender) => {
    console.log('content', request, sender)
    pop(request)
})
