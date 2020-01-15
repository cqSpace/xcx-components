var deltaY = 0,
    pointY = 0,
    pointList = [],
    lastPointerId = 0,
    lastDeltaY = 0;

function touchstart(e, func) {
    var touches = e.changedTouches;
    pointY = touches[0].pageY; //当前手指坐标
    lastPointerId = touches[0].identifier;
    lastDeltaY = deltaY + 0;
    if (e.touches.length == 1) {
        pointList = [lastPointerId];
    } else {
        pointList.push(lastPointerId);
    }
    func && func();
}

function touchmove(e, func) {
    var touch = e.changedTouches[0];
    var hasTouch = false;
    if (e.changedTouches.length > 1) {
        for (var i = e.changedTouches.length - 1; i >= 0; i--) {
            if (e.changedTouches[i].identifier == lastPointerId) {
                touch = e.changedTouches[i];
                hasTouch = true;
                break;
            }
        }
    } else if (lastPointerId != touch.identifier) {
        return
    }
    //坑，压缩代码有问题，只能这样写了
    if (e.changedTouches.length > 1 && !hasTouch) {
        return
    }
    deltaY = lastDeltaY + touch.pageY - pointY;
    func && func(deltaY);
}

function touchend(e, func) {
    e.changedTouches.map(function (item) {
        var idx = pointList.indexOf(item.identifier);
        if (idx != -1) {
            pointList.splice(idx, 1);
        }
    })
    var touches = e.touches.filter(function (item) {
        return pointList.indexOf(item.identifier) != -1
    });
    if (touches.length) {
        var lastTouches = touches[touches.length - 1];
        lastPointerId = lastTouches.identifier;
        pointY = lastTouches.pageY;
        lastDeltaY = deltaY + 0;
        return
    }
    func && func(deltaY);
    lastDeltaY = 0;
    lastPointerId = 0;
    pointY = 0;
    deltaY = 0;
    pointList = [];
}

module.exports = {
    onStart: touchstart,
    onMove: touchmove,
    onEnd: touchend
}