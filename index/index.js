Page({
    data: {

    },
    onLoad() {
        this.loadComponents();
    },
    loadComponents() {
        this.popMaskOne = this.selectComponent("#popMaskOne");
        this.popMaskOne.setConfig({
            title: '弹层一',
            subTitle: 'demo',
            closeFn: () => {
                console.log('关闭')
            },
            buttons: [{
                txt: '确定',
                fn: () => {
                    console.log('确定')
                }
            }]
        });
        this.popMaskTwo = this.selectComponent("#popMaskTwo");
        this.popMaskTwo.setConfig({
            title: '弹层二',
            subTitle: '展示说明文案',
            isExplain: true
        });
        this.popMaskThree = this.selectComponent("#popMaskThree");
        this.popMaskThree.setConfig({
            showBtn: false,
            top: ''
        });
    },
    popOne() {
        this.popMaskOne.showPopMasker();
    },
    popTwo() {
        this.popMaskTwo.showPopMasker();
    },
    popThree() {
        this.popMaskThree.showPopMasker();
    }
})