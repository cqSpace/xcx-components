/*
 * @Author: chenqiu 
 * @Date: 2018-05-11 10:05:48 
 * @Last Modified by: chenqiu
 * @Last Modified time: 2018-10-21 10:41:39
 */
/* 
    尽量将组件使用在page里面，不要嵌套使用（如果放在自定义组件里使用，务必要作为兄弟节点存在）;

    fixedBg: true, //是否固定背景
    isExplain: false, //是否用于展示说明文案
    isDealIphoneX: true, //是否处理iphoneX兼容
    showBtn: true, //是否显示默认按钮（默认显示）
    top: '78', //距离顶部高度
    radius: '', //圆角值
    maskBgColor: '', //弹层背景
    title: '', //标题
    subTitle: '', //副标题
    tips: '', //提示文案
    bottomTips: '', //底部提示文案
    bgClose: true, //点击背景是否可关闭
    closeFn: '', //关闭绑定的方法名或者方法
    scrollToTop: false, //是否每次滚动到顶部
    scrollToView: false, //开启scrollToView，设置滚动需要到插槽内部实现 
    buttons: [{  //按钮数组
        color: '',  //按钮文子颜色
        bgColor: '', //按钮背景
        txt: '确定', //按钮文案
        fn: '', //按钮绑定的方法名或者方法
        exefn: false //是否先执行逻辑(绑定的方法需return true/false)
    }]

    showPopMasker() hidePopMasker() 供外部调用
    
    使用事例：使用setConfig(options)
    <popMasker>
        ........
    </popMasker> 
*/
Component({
    data: {
        customs: {
            fixedBg: true,
            isExplain: false,
            isDealIphoneX: true,
            showBtn: true,
            component: '', //目标组件的名称
            top: '78', //距离顶部高度
            radius: '',
            maskBgColor: '',
            title: '',
            subTitle: '',
            tips: '',
            bottomTips: '',
            bgClose: true,
            closeFn: '',
            scrollToTop: false, //是否每次滚动到顶部
            scrollToView: false, //开启scrollToView，设置滚动需要到插槽内部实现
            buttons: []
        },
        boxStyle: '',
        maskBgStyle: '',
        isIphoneX: wx.getSystemInfoSync().model.indexOf('iPhone X') > -1 || wx.getSystemInfoSync().model.indexOf('iPhone11') > -1,
        showPop: false, //是否展示弹层
        scrollTop: 0,
        animationData: {}, //动画
        animationData1: {} //动画1
    },
    created: function() {
        this.isOpen = false;
        this.windowHeight = wx.getSystemInfoSync().windowHeight;
        this.animation = wx.createAnimation({
            duration: 200,
            timingFunction: 'linear'
        })
        this.animation1 = wx.createAnimation({
            duration: 200,
            timingFunction: 'ease'
        })
    },
    methods: {
        setConfig(options) {
            let customs = Object.assign(this.data.customs, options);
            let data = {
                customs: customs
            };
            let boxStyle = '';
            if (customs.top) boxStyle += 'top:' + customs.top * 2 + 'rpx;';
            if (customs.radius || customs.radius === 0) {
                if (customs.radius == 0) {
                    boxStyle += 'border-radius: 0;'
                } else {
                    let radius = customs.radius * 2 + 'rpx';
                    boxStyle += 'border-radius:' + radius + ' ' + radius + ' 0 0;'
                }
            }
            if (boxStyle) {
                data.boxStyle = boxStyle;
            }
            if (customs.maskBgColor) {
                data.maskBgStyle = 'background-color:' + customs.maskBgColor + ';';
            }
            this.setData(data);
        },
        _myEvent(data) {
            if (data.exefn && data.fn && typeof data.fn == 'function') { //先执行方法
                if (data.fn()) {
                    this.hidePopMasker();
                }
            } else {
                this.hidePopMasker();
                if (data.fn && typeof data.fn == 'function') {
                    data.fn();
                }
            }
        },
        _transitionEnd() {
            if (!this.isOpen) {
                this.setData({
                    showPop: false
                })
            } else {
                if (this.data.customs.showBtn && this.curPage.trainPopShowLen == 1) {
                    //弹起动画结束设置页面静止滚动
                    if (this.data.customs.fixedBg) {
                        this.curPage.setData({
                            scrollStyle: 'position:fixed;left:0;right:0;bottom:0;top:' + (this.scrollTop ? '-' + this.scrollTop + 'px;' : '0;')
                        })
                    } else {
                        this.curPage.setData({
                            scrollStyle: 'overflow:hidden;height:100%;'
                        })
                    }
                }
            }
        },
        noAction() {
            //阻止触发隐藏弹层方法
        },
        _setCurPageInfo() { //初始化弹层
            if (!this.curPage) {
                let pages = getCurrentPages();
                this.curPage = pages[pages.length - 1]; //当前页面Page
                if (this.curPage.trainPopShowLen == undefined) {
                    this.curPage.trainPopShowLen = 0; //初始化弹层展示数量
                }
                pages = null;
            }
        },
        showPopMasker() {
            if (this.isOpen) {
                return
            }
            this.isOpen = true;
            this._setCurPageInfo();
            if (this.data.customs.showBtn) {
                //记录当前弹出层展示的数量
                this.curPage.trainPopShowLen += 1;
                //记录弹层弹起前的滚动距离
                if (!this.scrollTop && this.curPage.trainPopShowLen == 1) {
                    let query = wx.createSelectorQuery().selectViewport().scrollOffset();
                    query.exec((res) => {
                        //显示区域的竖直滚动位置 
                        if (res[0].scrollTop != 0) {
                            this.scrollTop = res[0].scrollTop;
                        }
                    })
                }
            }
            let setInfo = {
                    showPop: true
                }
                //滚动到顶部
            if (this.data.customs.scrollToTop) {
                setInfo.scrollTop = 0;
            }
            this.setData(setInfo);
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                if (this.data.customs.maskBgColor == 'transparent') {
                    this.animation1.translateY(0).step()
                    this.setData({
                        animationData1: this.animation1.export()
                    })
                } else {
                    this.animation.opacity(1).step()
                    this.animation1.translateY(0).step()
                    this.setData({
                        animationData: this.animation.export(),
                        animationData1: this.animation1.export()
                    })
                }
            }, 60)
        },
        hidePopMasker() {
            if (!this.isOpen) {
                return
            }
            this.isOpen = false;
            if (this.data.customs.showBtn) {
                if (this.curPage.trainPopShowLen == 1) {
                    //弹窗收起设置页面可以滚动
                    this.curPage.setData({
                            scrollStyle: ''
                        })
                        //滚动到之前记录的滚动位置
                    wx.pageScrollTo({
                        scrollTop: this.scrollTop,
                        duration: 0
                    })
                    this.scrollTop = '';
                }
                //弹层展示数量减掉1
                this.curPage.trainPopShowLen -= 1;
            }
            if (this.data.customs.maskBgColor == 'transparent') {
                this.animation1.translateY('100%').step()
                this.setData({
                    animationData1: this.animation1.export()
                });
            } else {
                this.animation.opacity(0).step()
                this.animation1.translateY('100%').step()
                this.setData({
                    animationData: this.animation.export(),
                    animationData1: this.animation1.export()
                });
            }
        },
        _cancel() {
            this._myEvent({
                fn: this.data.customs.closeFn
            })
        },
        btnClick(e) {
            let data = this.data.customs.buttons[e.target.dataset.index * 1];
            this._myEvent(data);
        }
    }
})