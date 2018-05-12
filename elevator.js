// debug模式
var DEBUG_MODE = true;
// 电梯数目
const elevatorNumber = 5;
// 时间最大阙值,20楼，每层楼均停留4s，来回一整趟为200s
const MAX_TIME = 300;
// 楼层最高数
const MAX_FLOOR = 20;
// 楼层最低数
const MIN_FLOOR = 0;
// 每一楼层开关门总时间
const OPEN_CLOSE_TIME = 4;  
// 电梯的状态：等待0, 上行1, 下行-1  
var state = new Array(elevatorNumber);
// 电梯状态是否更新
var StateIsUpdated = new Array(elevatorNumber);
// 电梯是否为运动状态
var BRunning= new Array(elevatorNumber);
// 请求是否同电梯运动方向为同向
var sameDirection = new Array(elevatorNumber);
// 电梯当前楼层
var currentFloor = new Array(elevatorNumber);
// 存放挂起等待状态的dial楼层
var waitFloor = new Array();
// 存放挂起等待状态的dial方向
var waitUp = new Array();
// 存放挂起等待状态的dial老化级别
var waitAging = new Array();
// 是否存在挂起等待状态的dial
var Bwait = false;
// 存放五个电梯的运行队列,均顺序排列,由小到大
var Queues = new Array(elevatorNumber);
// 五部电梯线程的计时器
var timers = new Array(elevatorNumber);
// 当前停留状态
var BStop = new Array(elevatorNumber);

// 初始化变量
function init() {
    for(var i = 0; i < elevatorNumber; i++) {
        state[i] = 0;
        StateIsUpdated[i] = false;
        BRunning[i] = false;
        BStop[i] = true;
        currentFloor[i] = 1;
        Queues[i] = new Array();
        timers[i] = setInterval("main("+i+")", 1000);
    }
}
$(document).ready(init);

//**其他按键**
//响应紧急键
$(".emergency").click(function(){
    alert("呼救中……");
});
//响应开门键
$(".open").click(function(){
    var panel = $(this).parent().parent()[0].id;
    var number = Number(panel.substr(5))-1;
    
    // if(BRunning[number]==false){
    //     openDoor(number);
    // }else{
    //     alert("请不要在电梯运行过程中开门。");
    // }
    if(BStop[number]==true||state[number]==0){
        openDoor(number);
    }else{
        alert("请不要在电梯运行过程中开门。");
    }
});
//响应关门键
$(".close").click(function(){
    var panel = $(this).parent().parent()[0].id;
    var number = Number(panel.substr(5))-1;

    closeDoor(number);
});

//**楼栋按键**
//响应上行键
$(".up").click(function(){
    var this_id = $(this).parent()[0].className;
    var number = Number(this_id.substr(5));
    console.log("this_id:"+this_id+" number:"+number);
    dial(number, true);
    $(".floor"+number+" .up.buttonOut").addClass("on");
});

//响应下行键
$(".down").click(function(){
    var this_id = $(this).parent()[0].className;
    var number = Number(this_id.substr(5));
    dial(number, false);
    $(".floor"+number+" .down.buttonOut").addClass("on");
});

//**面板按键**
//响应数字按钮
$(".insideButton").click(function(){
    var className = $(this)[0].className;
    var parentID = $(this).parent()[0].id;
    var dialFloor = Number(className.substr(17));
    var elevatorNumber = Number(parentID.substr(6));

    if(DEBUG_MODE){
        console.log("面板上按下："+elevatorNumber+"号电梯"+dialFloor+"楼层");
    }  

    $(this).css("background-color" , "#fff");
    if(state[elevatorNumber-1]==0){
        var up = ( dialFloor > currentFloor[elevatorNumber-1] )? true : false;
        changeStatusToRun(elevatorNumber-1, dialFloor, up);
    }
    AddInQueue(elevatorNumber-1,dialFloor);
});

//n号电梯上行
function moveUp(n){
    if(currentFloor[n] < MAX_FLOOR){
        currentFloor[n]++;
    }
}

//n号电梯下行
function moveDown(n){
    if(currentFloor[n] > MIN_FLOOR){
        currentFloor[n]--;
    }
}

//n号电梯开关门
function openDoor(n) {
    if (timers[n]) {
        clearInterval(timers[n]);
    }
    $("#elevator"+ (n+1) ).css("left", "20%");
    //开门2s,关门2s，总停搁时间为4s
    // setTimeout(function(){
    //     closeDoor(n);
    //     setTimeout(function(){
    //         timers[n] = setInterval("main("+n+")",1000);
    //     },1000);
    // },2000);
    setTimeout(function(){
            if (timers[n]) {
                clearInterval(timers[n]);
            }
            setTimeout(function(){
                if (timers[n]) {
                    clearInterval(timers[n]);
                }
                setTimeout(function(){
                    closeDoor(n);
                    setTimeout(function(){
                        timers[n] = setInterval("main("+n+")", 1000);
                    }, 1000);
                }, 500);
            }, 500)
        }, 1000)
}

//n号电梯关门
function closeDoor(n) {
    $("#elevator"+ (n+1) ).css("left", "60%");
}
//n号电梯到达floor楼层之后，熄灯
function lightOut(n, floor){
    //熄灭电梯内部面板上的灯
    $("#dial_E"+(n+1)+" .dial"+floor).css("background-color","#f4d6d6");
    //熄灭楼层同向请求的灯
    if(DEBUG_MODE){
        console.log("电梯"+n+"到达楼层"+floor+"当前状态是"+state[n]);
    }
    if(state[n] == 1  || sameDirection[n] == false){
        $(".floor"+ floor +" .up.buttonOut.on").removeClass("on");
    }
    if(state[n] == -1 || sameDirection[n] == false){
        $(".floor"+ floor +" .down.buttonOut.on").removeClass("on");
    }

}

//楼栋中有上下楼请求,上行up为true，下行up为false;
function dial(floor, up){
    var fit = fittest(floor, up);
    
    if(fit == -1){              //电梯均不便，挂起该请求
        hangUpDial(floor, up);
    }else{                      //电梯fit方便，响应该请求
       acceptDial(fit, floor, up); 
    }
}

//响应该dial
function acceptDial(fit, floor, up){
    //如果电梯fit处于等待状态，则更新该状态
    if(state[fit]==0){      
        changeStatusToRun(fit, floor, up);
    }
    //加入电梯fit队列
    AddInQueue(fit, floor);
}

//挂起dial至等待队列
function hangUpDial(floor, up){
    waitFloor.push(floor);
    waitUp.push(up);
    waitAging.push(0);
    Bwait = true;
    //更新优先级
    for(var i = 0; i< waitUp.length; i++){
        waitAging[i]++;
    }
}

//唤醒等待队列中的dial，当老化级别>1时，优先响应。
function arouseWaiting(n){
    var arouseIndex = 0;
    var temp_CostTime = 0;
    var costTime =MAX_TIME;
    for(var i = 0; i < waitUp.length; i++){
        temp_CostTime = timeCost(i, waitFloor[i], waitUp[i]);
        //考虑老化现象
        if(waitAging[i]>1 && temp_CostTime != -1){
            acceptDial(n, waitFloor[i], waitUp[i]);
            updateWaiting(i);
            return;
        }
        //正常情况，找顺路的时间花费最小值
        if(costTime > temp_CostTime && temp_CostTime != -1){
            arouseIndex = i;
            costTime = temp_CostTime;
        }
    }

    if(costTime!=MAX_TIME){
        acceptDial(n, waitFloor[arouseIndex], waitUp[arouseIndex]);
        updateWaiting(arouseIndex);
    }
}

//唤醒dial后更新等待队列
function updateWaiting(index){
    waitFloor.splice(index,1);
    waitUp.splice(index,1);
    waitAging.splice(index,1);
    
    if(waitUp.length==0){
        Bwait=false;
    }
}

//由等待至运行改变状态
function changeStatusToRun(n, floor, up){
    if(state[n]==0){
        if(currentFloor[n] > floor){
            state[n] = -1;
            sameDirection[n] = (up==true)? false : true;

        }else{
            if(currentFloor[n] < floor){
                state[n] = 1;
                sameDirection[n] = (up==false)? false : true;
            }else{
                state[n] = (up==1)? 1:-1;
                sameDirection[n] = true;
            }
        }
        if(DEBUG_MODE){
            console.log("由等待改变至"+state[n]+"状态");
        }
        if(state[n]==1){
            $("#showUp"+(n+1)).addClass("on");  //上行电梯内信号灯
        }else{
            $("#showDown"+(n+1)).addClass("on");    //下行电梯内信号灯
        }
        BRunning = true;
    }
}

//返回顺路级别最高的电梯号fit;均不合适则返回-1.
function fittest(floor, up){
    var fit = 0;
    var temp = 0;
    var cost = MAX_TIME;

    for(var i = 0; i < elevatorNumber; i++){
        temp =timeCost(i, floor, up);
        if(cost > temp && temp != -1){
            cost = temp;
            fit = i;
        }
    }
    //每个电梯cost均为-1，则该请求为挂起状态
    if(cost == MAX_TIME){
        fit = -1;
    }
    return fit;
}

//计算电梯花费时长，其中停搁楼层4s,上行/下行1s
function timeCost(n, floor, up){
    var cost = 0;
    //电梯等待状态
    if(state[n]==0){
        cost = Math.abs(currentFloor[n] - floor);
    }
    //电梯上行
    if(state[n]==1){
        //顺路
        if(up==true && floor>currentFloor[n]){
            cost = floor-currentFloor[n];
            for(var i = 0; Queues[n][i] < floor; i++){
                cost += OPEN_CLOSE_TIME;
            }
        }else{ //不顺路,即：需要走到顶，然后下来接之类的
            // cost = Queues[n][(Queues[n].length -1)]-currentFloor[n];
            // cost += Math.abs(Queues[n][(Queues[n].length-1)]-floor);
            cost = -1;
        }
    }
    //电梯下行
    if(state[n]==-1){
        //顺路
        if(up==false && floor<currentFloor[n]){
            cost = currentFloor[n] - floor;
            for(var i = Queues[n].length - 1; Queues[n][i] > floor; i--){
                cost += OPEN_CLOSE_TIME;
            }
        }else{  //不顺路,即：需要走到底，然后上去接之类的
            // cost = currentFloor[n]-Queues[n][0];
            // cost += Math.abs(Queues[n][0]-floor);
            cost = -1;
        }
    }
    return cost;
}

//加入电梯内调度
function AddInQueue(n, floor){
    Queues[n].push(floor);
    Queues[n].sort(function(a,b){
        return a - b;
    });

}

//n号电梯到达当前楼层
function arrive(n){
    //获取当前楼层在队列中的index
    var arriveIndex = Queues[n].indexOf(currentFloor[n]);
    //从该队列中删除该楼层
    Queues[n].splice(arriveIndex,1);
    //熄灯
    lightOut(n,currentFloor[n]);
    //开门
    openDoor(n);
}

//判断当前的状态是否要更新，若需要更新，则更新，并返回true，否则则返回false
function updateStatus(n){
    var length = Queues[n].length;

    //队列为空，则电梯：等待状态，非运行态
    if(length == 0){
        if(state[n]==1){
            $("#showUp"+(n+1)).removeClass("on");
        }else{
            $("#showDown"+(n+1)).removeClass("on"); 
        }
        state[n] = 0;
        BRunning = false;
        return true;
    }

    //向上走到顶了，但仍旧队列存在请求,则电梯反向
    if(state[n]==1 && Queues[n][length-1] < currentFloor[n]){
        state[n] = -1;
        //电梯内部方向灯改变方向
        $("#showUp"+(n+1)).removeClass("on");
        $("#showDown"+(n+1)).addClass("on");
        return true;
    }
    //向下走到底了，但队列仍旧存在请求，则电梯反向
    if(state[n]==-1 && Queues[n][0] > currentFloor[n]){
        state[n] = 1;
        //电梯内部方向灯改变方向
        $("#showDown"+(n+1)).removeClass("on");
        $("#showUp"+(n+1)).addClass("on");
        return true;
    }

    return false;
}

//主函数
function main(n){
    //如果对该楼层有过内部dial或外部dial
    if(Queues[n].includes(currentFloor[n])){
        BStop[n]= true;
        //到达后：更新队列、开关门、熄灯等一系列动作
        arrive(n);
        //更新电梯运行状态
        StateIsUpdated[n] = updateStatus(n);
        //如果有楼层的状态更新，则意味着等待队列可以被唤起
        if(StateIsUpdated[n] == true && Bwait ==true){
             arouseWaiting(n);
             StateIsUpdated[n] = false;
        }

    }else{
        BStop[n] = false;
        //电梯移动
        if(state[n]==1){
            moveUp(n);
        }
        if(state[n]==-1){
            moveDown(n);
        }
    }
    //更新到达当前楼层
    updateFloorInfo(n);
}

//更新页面
function updateFloorInfo(n) {
    // 更新面板上当前层数显示
    if(currentFloor[n]>0){
        $("#showNumber"+(n+1)).text(""+currentFloor[n]);
    }
    //电梯的上下移动效果
    var height = (currentFloor[n]-1) * 5;
    $("#elevator"+(n+1)).css("bottom",""+height+"%");
}

