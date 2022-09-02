chrome.runtime.sendMessage({
    action: 'checkRulesUpdate'
})

$(document).ready(() => {
    window.addEventListener("mouseup", (e) => {
        if (e && e.altKey) {
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
                const okLoading = $('<div class="ok-loading"></div>')
                okLoading.css('width', '8px')
                okLoading.css('height', '8px')
                okLoading.css('position', 'absolute')
                okLoading.css('left', $(target).offset().left)
                okLoading.css('top', $(target).offset().top)
                okLoading.css('z-index', 2147483647)
                okLoading.css('background', '#36395A')
                $('body').append(okLoading)
                const animateLoading = () => {
                    okLoading.animate({
                        left: ($(target).offset().left + $(target).width() - 8) + 'px'
                    }, $(target).width() * 2, 'linear', () => {
                        okLoading.animate({
                            top: ($(target).offset().top + $(target).height() - 8) + 'px'
                        }, $(target).height() * 2, 'linear', () => {
                            okLoading.animate({
                                left: $(target).offset().left
                            }, $(target).width() * 2, 'linear', () => {
                                okLoading.animate({
                                    top: $(target).offset().top
                                }, $(target).height() * 2, 'linear', () => {
                                    animateLoading()
                                })
                            })
                        })
                    })
                }
                animateLoading()

                chrome.runtime.sendMessage({
                    action: 'download',
                    url: target.currentSrc
                }, response => {
                    console.log(response)
                    if (response.error) {
                        download(response)
                    } else {
                        download({ target: target, loading: okLoading })
                    }
                })
            } else {
                download({ error: '无法检测到图片' })
            }
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
    } else {
        container.find('.ok-status').text('保存成功')
        container.find('.ok-status').css('color', '#06ae56')
    }
    $('body').append(container)

    const complete = () => {
        setTimeout(() => container.remove(), 3000)

        isRunning = false
        queue.pop()
        if (queue.length > 0) pop(queue[0])
    }
    if (loading) loading.remove()
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
