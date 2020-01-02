/*
 * @Author: cq27021 
 * @Date: 2018-05-11 10:05:48 
 * @Last Modified by: cq27021
 * @Last Modified time: 2019-06-05 17:07:20
 */
/* 
    尽量将组件使用在page里面，不要嵌套使用（如果放在自定义组件里使用，务必要作为兄弟节点存在）;
    所有的popMasker层级都是一致的，后续节点覆盖前面节点;
    popMasker里的东西要预订义好，不能动态的插入，所以页面结构上要保证放置的顺序！
    ！！！！尽量使用setConfig方法来配置参数，后续properties方式将废弃

    closeTouch: false, //是否关闭下滑
    isExplain: false, //是否用于展示说明文案
    isDealIphoneX: true, //是否处理iphoneX兼容
    showBtn: true, //是否显示默认按钮（默认显示）
    top: '78', //距离顶部高度(px)，设置为''高度自适应
    radius: '', //圆角值
    maskBgColor: '', //弹层背景
    popBgColor: '', //内容背景
    headStyle: '', 自定义头部样式
    title: '', //标题
    subTitle: '', //副标题
    tips: '', //提示文案
    bottomTips: '', //底部提示文案
    bgClose: true, //点击背景是否可关闭
    showCloseBtn: true, //是否展示关闭按钮
    closeFn: '', //关闭绑定的方法名或者方法
    exeCloseFn: false, //关闭方法是否拦截
    scrollToTop: false, //是否每次滚动到顶部
    scrollToView: false, //开启scrollToView，设置滚动需要到插槽内部实现 
    buttons: [{  //按钮数组
        color: '',  //按钮文子颜色
        bgColor: '', //按钮背景
        txt: '确定', //按钮文案
        fn: '', //按钮绑定的方法名或者方法
        exefn: false, //是否先执行逻辑(绑定的方法需return true/false)
        isAfterHide: false //是否隐藏后执行
    }]

    showPopMasker(callback) hidePopMasker(callback) 供外部调用
    
    使用事例：setConfig(options)
    <popMasker>
        ........
    </popMasker> 
*/
let sysInfo = wx.getSystemInfoSync();
Component({
    options: {
        multipleSlots: true
    },
    data: {
        customs: {
            closeTouch: false,
            isExplain: false,
            isDealIphoneX: true,
            showBtn: true,
            top: 78, //距离顶部高度px，设置为''高度自适应
            radius: '',
            maskBgColor: '',
            popBgColor: '',
            headStyle: '',
            title: '',
            subTitle: '',
            tips: '',
            bottomTips: '',
            bgClose: true,
            showCloseBtn: true,
            closeFn: '',
            exeCloseFn: false,
            scrollToTop: false, //是否每次滚动到顶部
            scrollToView: false, //开启scrollToView，设置滚动需要到插槽内部实现
            buttons: [],
            overflowVisible: false
        },
        scrollHeight: '100%',
        hideLength: 40,
        boxStyle: '',
        maskBgStyle: '',
        maskBgAnimate: '',
        boxAnimate: '',
        isIphoneX: sysInfo.model.indexOf('iPhone X') > -1 || sysInfo.model.indexOf('iPhone11') > -1,
        showPop: false, //是否展示弹层
        isAnimating: false, //是否在动画中
        scrollTop: 0,
        isBrace: false, //是否撑起滚动内容（兼容安卓下拉刷新）
        canUseWxs: compareVersion(sysInfo.SDKVersion, '2.4.4') >= 0 //是否可用Wxs
    },
    created() {
        this.maxHeight = sysInfo.windowHeight - Math.trunc(sysInfo.windowWidth / 750 * 156);
        this.isOpen = false;
        this.hasPullRefresh = false; //当前页面是否有下拉刷新功能
        this.isIos = sysInfo.platform == 'ios'; //是否是苹果
        this.hasDoEvent = false; //是否执行过btn绑定的方法（一个开关周期只执行一次）
        this.doTransitionEnd = false; //是否触发transitionEnd(保底，确保流程走下去)
    },
    methods: {
        setConfig(options) {
            let customs = Object.assign(this.data.customs, options);
            this.setData(Object.assign({
                customs,
            }, this.getPopStyle(customs), this.setTransition()));
        },
        getPopStyle(customs) {
            let boxStyle = '', maskBgStyle = '';
            if (customs.top) {
                boxStyle += 'top:' + (customs.top * 2) + 'rpx;';
            }
            if (customs.radius !== '') {
                let cs = ''
                if (customs.radius == 0) {
                    cs = 'border-radius: 0;';
                } else {
                    let radius = customs.radius * 2 + 'rpx';
                    cs = 'border-radius:' + radius + ' ' + radius + ' 0 0;';
                }
                boxStyle += cs;
            }
            if (customs.popBgColor) {
                boxStyle += 'background-color:' + customs.popBgColor + ';';
            }
            if (customs.overflowVisible) {
                boxStyle += 'overflow:visible;';
            }
            if (customs.maskBgColor) {
                maskBgStyle = 'background-color:' + customs.maskBgColor + ';';
            }
            this.copyBoxStyle = boxStyle + '';
            return {
                boxStyle,
                maskBgStyle            
            }
        },
        _myEvent(data) {
            if (this.hasDoEvent) {
                return
            }
            this.hasDoEvent = true;
            if (data.exefn && data.fn) { //先执行逻辑
                if (data.fn()) {
                    this.hidePopMasker();
                } else {
                    this.hasDoEvent = false;
                    if (this.isFromTouchEnd) {
                        this.isFromTouchEnd = false;
                        this.resetBox();
                    }
                }
            } else {
                if (data.isAfterHide) {
                    this.hidePopMasker(() => {
                        data.fn && data.fn();
                    });
                } else {
                    this.hidePopMasker();
                    data.fn && data.fn();
                }
            }
        },
        _transitionEnd() {
            this.doTransitionEnd = true;
            if (!this.isOpen) {
                this.setData({
                    showPop: false,
                    isAnimating: false
                })
                this.hideCallBack && this.hideCallBack();
            } else {
                this.setData({
                    isAnimating: false
                })
                this.showCallBack && this.showCallBack();
            }
        },
        noAction() {
            //阻止触发隐藏弹层方法
        },
        _setCurPageInfo() { //初始化弹层
            if(!this.curPage) {
                let pages = getCurrentPages();
                this.curPage = pages[pages.length - 1]; //当前页面Page
                this.hasPullRefresh = this.curPage && this.curPage.onPullDownRefresh ? true : false; //是否有下拉刷新功能
                pages = null;
            }
        },
        _getScrollTop(callback) {
            try {
                let query = wx.createSelectorQuery().selectViewport().scrollOffset();
                query.exec((res) => {
                    callback && callback(res[0].scrollTop);
                })
            } catch (e) {
                callback && callback(0);
            }
        },
        checkMaxHeight(callBack) {
            if (this.data.customs.top == '') {
                try {
                    let query = wx.createSelectorQuery().in(this); 
                    query.select('.popup-mask-box').boundingClientRect();
                    query.exec(res => {
                        if (res && res.length && res[0].height > this.maxHeight) {
                            this.setData({
                                boxStyle: this.copyBoxStyle + 'top: 156rpx;'
                            }, () => {
                                callBack();
                            })
                        } else {
                            callBack();
                        }
                    })
                } catch (e) {
                    callBack();
                }
            } else {
                callBack();
            }
        },
        //ios低版本scroll-view高度100%不正确,高度重置
        checkScrollHeight() {
            try {
                let query = wx.createSelectorQuery().in(this); 
                query.select('.popup-mask-box').boundingClientRect();
                query.select('.popup-body').boundingClientRect();
                query.select('.scroll-view').boundingClientRect();
                query.exec(res => {
                    if (res && res.length) {
                        let setData = '';
                        if (res[0]) {
                            //下拉隐藏的长度
                            let hideLength = Math.round(res[0].height / 4) || 40;
                            if (hideLength != this.data.hideLength) {
                                setData = {
                                    hideLength: hideLength
                                }
                            }
                        }
                        if (res[1] && res[2] && res[1].height != res[2].height) {
                            if (setData) {
                                setData.scrollHeight = res[1].height + 'px';
                            } else {
                                setData = {
                                    scrollHeight: res[1].height + 'px'
                                }
                            }
                        }
                        if (setData) {
                            this.setData(setData);
                        }
                    }
                })
            } catch (e) {}
        },
        _setShowData(isBrace) {
            let setInfo = {
                showPop: true,
                isBrace: isBrace,
                isAnimating: true,
                boxStyle: this.copyBoxStyle + ''
            }
            //滚动到顶部
            if (this.data.customs.scrollToTop) {
                setInfo.scrollTop = 0;
            }
            this.setData(setInfo, () => {
                this.timer = setTimeout(() => {
                    this.checkMaxHeight(() => {
                        this.checkScrollHeight(); //ios低版本scroll-view高度100%不正确
                        this.setData(this.setTransition(), () => {
                            this.checkAnimateStatus();
                        });
                        if (isBrace) {
                            wx.pageScrollTo({
                                scrollTop: 1,
                                duration: 0
                            });
                        }
                    })
                }, 60);
            });
        },
        showPopMasker(callBack) {
            if (this.isOpen || this.data.isAnimating) {
                return
            }
            clearTimeout(this.timer);
            clearTimeout(this.checkTimer);
            this.showCallBack = callBack || '';
            this.isOpen = true;
            this.hasDoEvent = false;
            this.doTransitionEnd = false;
            this._setCurPageInfo();
            //有下拉刷新功能&&不是苹果系统
            if (this.hasPullRefresh && !this.isIos) {
                this._getScrollTop((scrollTop) => {
                    this._setShowData(scrollTop == 0); //页面没有滚动高度需撑起滚动容器
                })
            } else {
                this._setShowData(false);
            }
        },
        hidePopMasker(callBack) {
            if (!this.isOpen || this.data.isAnimating) {
                return
            }
            clearTimeout(this.timer);
            clearTimeout(this.checkTimer);
            this.isOpen = false;
            this.doTransitionEnd = false;
            this.hideCallBack = callBack || ''; //弹层隐藏动画结束之后回调
            this.setData(Object.assign({
                isAnimating: true
            }, this.setTransition()), () => {
                this.checkAnimateStatus();
            });
        },
        setTransition() {
            let maskBgAnimate = '', boxAnimate = '';
            if (this.isOpen) {
                maskBgAnimate = 'opacity: 1;';
                boxAnimate = '-webkit-transform:translate3d(0, 0, 0);transform:translate3d(0, 0, 0);-webkit-transition:transform 200ms ease-out;transition:transform 200ms ease-out;';
            } else {
                boxAnimate = '-webkit-transition:transform 200ms ease-in;transition:transform 200ms ease-in;';
            }
            return {
                maskBgAnimate: maskBgAnimate,
                boxAnimate: boxAnimate
            }
        },
        checkAnimateStatus() { //动画执行300毫秒后检查动画状态，卡顿或跳转页面时可能不会及时触发_transitionEnd
            this.checkTimer = setTimeout(() => {
                if (!this.doTransitionEnd) {
                    this._transitionEnd();
                }
                this.hasDoEvent = false;
            }, 300);
        },
        _cancel(e) {
            if (this.data.isAnimating) {
                return
            }
            this.isFromTouchEnd = (e || {}).type ? false : true;
            this._myEvent({
                fn: this.data.customs.closeFn,
                exefn: this.data.customs.exeCloseFn
            })
        },
        btnClick(e) {
            let data = this.data.customs.buttons[e.target.dataset.index * 1] || {};
            this._myEvent(data);
        },
        _onStart(e) {
            if (this.endTime && !this.data.isAnimating && (Date.now() - this.endTime < 250)) { //关闭有动画效果200ms，这里防止再次触发
                this.data.isAnimating = true;
            } else {
                this.endTime = '';
            }
            if (this.data.customs.closeTouch || this.data.isAnimating) {
                return
            }
            let touches = e.changedTouches;
            this.pointY = touches[0].pageY; //当前手指坐标
            this.lastPointerId = touches[0].identifier;
            this.lastDeltaY = (this.deltaY || 0) + 0;
            if (e.touches.length == 1) {
                this.pointList = [this.lastPointerId];
            } else {
                if (!this.pointList) {
                    this.pointList = [];
                } 
                this.pointList.push(this.lastPointerId);
            }
        },
        _onMove(e) {
            if (this.data.customs.closeTouch || this.data.isAnimating) {
                return
            }
            let touch = e.changedTouches[0];
            if (e.changedTouches.length > 1) {
                let hasTouch = false;
                for (let i = e.changedTouches.length - 1; i >= 0; i--) {
                    if (e.changedTouches[i].identifier == this.lastPointerId) {
                        touch = e.changedTouches[i];
                        hasTouch = true;
                        break;
                    }
                }
                if (!hasTouch) {
                    return
                }
            } else if (this.lastPointerId != touch.identifier) {
                return
            }
            this.deltaY = this.lastDeltaY + touch.pageY - this.pointY;
            if (this.deltaY < 0) this.deltaY = 0;
            this.setData({
                boxAnimate: `-webkit-transform:translate3d(0, ${this.deltaY}px, 0);transform:translate3d(0, ${this.deltaY}px, 0);-webkit-transition:none;transition:none;`
            })
        },
        _onEnd(e) {
            if (this.data.customs.closeTouch || this.deltaY == 0 || this.data.isAnimating) {
                return
            }
            e.changedTouches.map(item => {
                let idx = this.pointList.indexOf(item.identifier);
                if (idx != -1) {
                    this.pointList.splice(idx, 1);
                }
            })
            let touches = e.touches.filter(item => this.pointList.indexOf(item.identifier) != -1);
            if (touches.length) {
                let lastTouches = touches[touches.length - 1];
                this.lastPointerId = lastTouches.identifier;
                this.pointY = lastTouches.pageY;
                this.lastDeltaY = this.deltaY + 0;
                return
            }
            if (this.deltaY >= this.data.hideLength) {
                this.endTime = Date.now();
                this._cancel();
            } else {
                this.resetBox();            
            }
            this.lastDeltaY = 0;
            this.lastPointerId = 0;
            this.pointY = 0;
            this.deltaY = 0;
            this.pointList = [];
        },
        resetBox() {
            this.setData({
                boxAnimate: '-webkit-transform:translate3d(0, 0, 0);transform:translate3d(0, 0, 0);-webkit-transition:transform 200ms ease-out;transition:transform 200ms ease-out;'
            })
        }
    }
})

function compareVersion(v1, v2) {
    v1 = v1.split('.')
    v2 = v2.split('.')
    const len = Math.max(v1.length, v2.length)
    while (v1.length < len) {
        v1.push('0')
    }
    while (v2.length < len) {
        v2.push('0')
    }
    for (let i = 0; i < len; i++) {
        const num1 = parseInt(v1[i])
        const num2 = parseInt(v2[i])
        if (num1 > num2) {
            return 1
        } else if (num1 < num2) {
            return -1
        }
    }
    return 0
}