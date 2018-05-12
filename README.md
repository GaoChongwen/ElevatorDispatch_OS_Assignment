# 基于多线程的电梯调度系统

<p style="text-align:right">1652667 </p> 

<p style="text-align:right">梁栎鹏</p> 

[TOC]

## 一、项目分析

### 1. 项目背景

&emsp;某一层楼20层，有五部互联的电梯，基于线程思想，编写一个电梯调度程序。

### 2. 项目目的

- 学习调度算法
- 通过实现电梯调度，体会操作系统调度过程
- 学习特定环境下多线程方法

### 3. 功能需求

- 电梯内部功能键与状态显示：数字键、关门键、开门键、上行键、下行键、报警键、当前电梯的楼层数、上升及下降状态等。

- 电梯外部功能键与状态显示：上行键、下行键、当前电梯状态的数码显示器。

- 其它：
  a.	五部电梯外部按钮相互联结。（即：当一个电梯按钮按下去时，其他电梯的相应按钮也就同时点亮。）

  b.	所有电梯初始状态都在第一层。

  c.	每个电梯如果在它的上层或者下层没有相应请求情况下，在原地保持不动。

## 二、开发工具

- 开发环境：Chrome	Subline Text
- 开发语言：JavaScript 

## 三、术语表

| 术语     | 含义                                                         |
| :------- | :----------------------------------------------------------- |
| 外请求   | 五部电梯外部的楼层上/下行请求                                |
| 内请求   | 对于每部电梯而言，真正响应的楼层请求                         |
| 联结控制 | 共用一套呼梯信号系统，把两台或多台规格相同的电梯并联起来控制 |
| 外调度   | 调度五部电梯响应外请求                                       |
| 内调度   | 每部电梯调度响应所分配的外请求与来自内部的内请求             |
| 顺路级别 | 在该电梯当前运行状态下响应该外请求的顺路程度：以“是否需要改变运动方向”与“同方向时所需时间长短”来判定 |
| 请求队列 | 将被响应的外请求的集合                                       |
| 等待队列 | 不满足要求的外请求的集合                                     |
| 挂起     | 不满足一定顺路级别的外请求被移出请求队列，加入等待队列的操作 |
| 唤起     | 从等待队列中移出，重新加入请求队列的操作                     |
| 老化     | 从时间角度上看待在等待队列中等待的过程                       |
| 老化级别 | 老化的程度：以“等待时间的长短”判定                           |

## 四、设计

### 1. 总体算法设计

&emsp;本项目需要实现多电梯调度机制。对于多部电梯的外请求而言，本项目采用外调度算法，以调度电梯响应该请求；对于每部电梯的内请求而言，本项目采用内调度算法，以响应电梯内部的请求队列。

&emsp;**电梯运行状态转换图**如下：

<img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E7%94%B5%E6%A2%AF%E8%BF%90%E8%A1%8C%E7%8A%B6%E6%80%81%E8%BD%AC%E6%8D%A2%E5%9B%BE.png?raw=true" />

### 2. 调度算法设计

#### (1)外调度算法

&emsp;本项目了解到现实情况中人们对电梯的使用需求，采用了以**顺路级别**为标准的**优先级调度算法**，同时考虑到原优先级调度算法可能导致**饥饿现象**的出现，提出了结合**老化算法**的**优先级调度算法**。

- 调度算法：结合**老化**的**优先级调度算法**

  - **优先级调度算法**原理：

    > **优先级调度**：   
    >
    > ​		以**顺路级别**判定——顺路级别越高，优先级越高，最优者响应该外请求。
    >
    > **顺路级别**：
    >
    >  		a.	如电梯响应该外请求需要改变当前的运动方向（即：非顺路），则顺路级别最低，为-1；
    >
    > ​		b.	否则（即：顺路），如电梯从当前楼层运行至外请求楼层所花时间越短，顺路级别越高。
    >
    > **优先级的实现**：
    >
    > ​	         a.	如所有电梯对于该外请求的优先级均为-1，则将该外请求挂起，至等待状态；
    >
    > ​		 b.	否则，则将该外请求放入优先级最高的电梯的内调度队列中。

    

  - **优先级调度算法**存在的问题：

    >  ​	等待状态的外请求每次被唤起将再次计算优先级，则仍旧可能位于等待状态，因此可能出现饥饿现象。

    

  - **改进**——**老化**：

    > **改进方式**：
    >
    > ​		**老化算法**的引入。
    >
    > **老化**：
    >
    > ​		以**老化级别**判定——在等待队列中老化级别越高，越先被唤起。
    >
    > **老化级别**：
    >
    > ​		加入等待队列的外请求越早，老化级别越高。
    >
    > **老化的实现**（等待队列中）：
    >
    > ​		a.	当新的外请求被挂入等待队列中，等待队列中所有外请求老化级别均+1；
    >
    > ​		b.	当电梯有运动装状态改变时，优先唤起老化级别程度最高的外请求；
    >
    > ​		c.	如该外请求顺路级别仍为-1，则仍旧挂起；
    >
    > ​		d.	当老化级别 ≥ 2时，直接响应该外请求。

    

  - 结合**老化**的**优先级调度算法**：

    > 结合 **优先级调度算法** 与 **老化**，完成对优先级调度算法的改进。

  

- 调度类型：**中级调度**

  - 涉及外请求在**等待队列**与**请求队列**之间的交换。

  - 从外请求管理的角度来看，把部分位于请求队列的外请求换出至等待队列的外请求中，可为新的外请求响应提供更合适的电梯响应。

    

- 调度模式：**剥夺方式**

  - 采用**优先级原则**

    

- 外调度流程图

  <img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E5%A4%96%E8%B0%83%E5%BA%A6%E6%B5%81%E7%A8%8B%E5%9B%BE.png?raw=true"/>

- 外请求状态图

  <img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E5%A4%96%E8%AF%B7%E6%B1%82%E7%8A%B6%E6%80%81%E8%BD%AC%E6%8D%A2%E5%9B%BE.png?raw=true"/>

#### (2)内调度算法

- 调度算法：**LOOK算法**

  LOOK算法是扫描算法的一种改进。

  - **扫描算法**：

    > **扫描算法定义**：
    >
    > ​	扫描算法(SCAN)是一种按照楼层顺序依次服务请求的算法。
    >
    > **扫描算法原理**：
    >
    > ​	它让电梯在最底层和最顶层之间连续往返运行，在运行过程中响应处在于电梯运行方向相同的各楼层上的请求。
    >
    > **扫描算法优点**：
    >
    > ​	扫描算法较好地解决了电梯移动的问题，在这个算法中，每个电梯响应乘客请求使乘客获得服务的次序是由其发出请求的乘客的位置与当前电梯位置之间的距离来决定的，所有的与电梯运行方向相同的乘客的请求在一次电梯向上运行或向下运行的过程中完成，免去了电梯频繁的来回移动。
    >
    > **扫描算法缺陷**：
    >
    > ​	电梯所移动的方向上不再有内请求时，电电梯仍旧会运行至最顶层/最底层，导致电梯资源的浪费。

  

  - **LOOK算法**：

    > **LOOK算法原理**：
    >
    > ​	对LOOK算法而言，电梯同样在最底层和最顶层之间运行。但当LOOK算法发现电梯所移动的方向上不再有内请求时立即改变运行方向。
    >
    > **LOOK算法实现**：
    >
    > ​	扫描内调度队列，完成电梯所移动方向上的内请求后改变运动状态：
    >
    > ​		a.	如内调度队列中仍旧存在其它方向上的请求，则改变运动方向；
    >
    > ​		b.	否则，改变运动状态为等待。

    

- 调度模式：**非剥夺方式**

  

- 内调度流程图

  <img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E5%86%85%E8%B0%83%E5%BA%A6%E6%B5%81%E7%A8%8B%E5%9B%BE.png?raw=true"/>

- 内请求状态图

  <img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E5%86%85%E8%AF%B7%E6%B1%82%E7%8A%B6%E6%80%81%E8%BD%AC%E6%8D%A2%E5%9B%BE.png?raw=true"/>

### 3. 数据结构设计

#### (1)主要变量设计

- **全局**

| 变量名           | 类型           | 作用                                                         | 取值                    |
| ---------------- | -------------- | ------------------------------------------------------------ | ----------------------- |
| state[]          | Array[int]     | 存放每部电梯的状态                                           | 等待 0, 上行 1, 下行-1  |
| BRunning[]       | Array[bool]    | 记录每部电梯是否为运动状态                                   | 运动 true，非运动 false |
| sameDirection[]  | Array[bool]    | 记录响应的外请求的请求方向是否与电梯运动方向为同向           | 同向 true，反向 false   |
| StateIsUpdated[] | Array[bool]    | 记录电梯状态是否更新                                         | 是 true，否 false       |
| currentFloor[]   | Array[int]     | 存放电梯当前楼层                                             | 楼层号1-20              |
| timers[]         | Array[Inteval] | 每部电梯的计时器，以开启5个线程，1s执行一次各自的main函数，以更新界面 | ——                      |
| BStop[]          | Array[bool]    | 记录电梯是否为停留在某一楼层                                 | 是 true，否 false       |

- **外调度**

| 变量名      | 类型        | 含义                               | 取值                  |
| ----------- | ----------- | ---------------------------------- | --------------------- |
| waitFloor[] | Array[int]  | 存放挂起等待状态的外请求的请求楼层 | 楼层号1-20            |
| waitUp[]    | Array[bool] | 存放挂起等待状态的外请求的请求方向 | 向上true，向下false   |
| waitAging[] | Array[int]  | 存放挂起等待状态的外请求的老化级别 | 级别数1-2             |
| Bwait[]     | bool        | 记录是否存在挂起等待状态的外请求   | 存在true，不存在false |

- **内调度**

| 变量名   | 类型              | 含义                                       | 取值 |
| -------- | ----------------- | ------------------------------------------ | ---- |
| Queues[] | Array[Array[int]] | 存放五个电梯的运行队列,均顺序排列,由小到大 | ——   |

#### (2)主要函数设计

- **全局**

| 函数名             | 传入参数                                                     | 返回值 | 作用                           |
| ------------------ | ------------------------------------------------------------ | ------ | ------------------------------ |
| init()             | ——                                                           | ——     | 初始化变量                     |
| moveUp(n)          | n：电梯的标记号                                              | ——     | n号电梯上行                    |
| moveDown(n)        | n：电梯的标记号                                              | ——     | n号电梯下行                    |
| openDoor(n)        | n：电梯的标记号                                              | ——     | n号电梯开关门                  |
| closeDoor(n)       | n：电梯的标记号                                              | ——     | n号电梯关门                    |
| lightOut(n, floor) | n：电梯的标记号；                                   floor：到达的楼层数 | ——     | n号电梯到达floor楼层之后，熄灯 |
| arrive(n)          | n：电梯的标记号                                              | ——     | n号电梯到达当前楼层            |
| main(n)            | n：电梯的标记号                                              | ——     | n号电梯的主函数                |
| updateFloorInfo(n) | n：电梯的标记号                                              | ——     | 更新n号电梯的页面              |

- **外调度**

| 函数名                          | 传入参数                                                     | 返回值                                              | 作用                                                       |
| ------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------- |
| dial(floor, up)                 | floor：外请求的楼层数；up：外请求向上（上：true；下：false） | ——                                                  | 楼栋中有上下楼请求                                         |
| acceptDial(fit, floor, up)      | fit：响应该外请求的电梯的标记号；floor：该外请求的请求楼层；up：该外请求的请求方向（上：true；下：false） | ——                                                  | 响应该外请求                                               |
| hangUpDial(floor, up)           | floor：该外请求的请求楼层；up：该外请求的请求方向（上：true；下：false） | ——                                                  | 挂起该外请求至等待队列                                     |
| arouseWaiting(n)                | n：电梯的标记号                                              | ——                                                  | n号电梯唤醒等待队列中的外请求，当老化级别>1时，直接响应。  |
| updateWaiting(index)            | index：外请求在等待队列中的索引                              | ——                                                  | 唤醒外请求后更新等待队列                                   |
| changeStatusToRun(n, floor, up) | n：电梯的标记号；floor：该外请求的请求楼层；up：该外请求的请求方向（上：true；下：false） | ——                                                  | n号电梯由等待至运行改变运动、运行状态                      |
| fittest(floor, up)              | floor：该外请求的请求楼层；up：该外请求的请求方向（上：true；下：false） | 顺路级别最高的电梯号fit，顺路级别均为-1时，则返回-1 | 计算顺路级别并返回顺路级别最高的电梯号fit                  |
| timeCost(n, floor, up)          | n：电梯的标记号；floor：该外请求的请求楼层；up：该外请求的请求方向（上：true；下：false） | 返回花费时长                                        | 计算电梯响应该外请求的花费时长，其中停搁楼层4s,上行/下行1s |

- **内调度**

| 函数名               | 传入参数                                     | 返回值                        | 作用                       |
| -------------------- | -------------------------------------------- | ----------------------------- | -------------------------- |
| AddInQueue(n, floor) | n：电梯的标记号；floor：该外请求的请求楼层； | ——                            | 将f外请求加入n号电梯内调度 |
| updateStatus(n)      | n：电梯的标记号；                            | 需要更新：true；不需要：false | 判断当前的状态是否要更新   |

## 五、项目实现

### 1. 具体实现

#### (1)总体算法核心函数

//主函数

```
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
```



#### (2)外调度算法核心函数

//楼栋中有上下楼请求,上行up为true，下行up为false;

```
function dial(floor, up){
	var fit = fittest(floor, up);
    if(fit == -1){              //电梯均不便，挂起该请求
        hangUpDial(floor, up);
    }else{                      //电梯fit方便，响应该请求
       acceptDial(fit, floor, up); 
    }
}
```

//响应该dial

```
function acceptDial(fit, floor, up){

    //如果电梯fit处于等待状态，则更新该状态

    if(state[fit]==0){      

        changeStatusToRun(fit, floor, up);

    }

    //加入电梯fit队列

    AddInQueue(fit, floor);

}
```

//挂起dial至等待队列

```
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
```

//唤醒等待队列中的dial，当老化级别>1时，优先响应。

```
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
```

//返回顺路级别最高的电梯号fit;均不合适则返回-1.

```
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
```

//返回顺路级别最高的电梯号fit;均不合适则返回-1.

```
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
```



#### (3)内调度算法实现

//加入电梯内调度

```
function AddInQueue(n, floor){
    Queues[n].push(floor);
    Queues[n].sort(function(a,b){
        return a - b;
    });
}
```

//判断当前的状态是否要更新，若需要更新，则更新，并返回true，否则则返回false

```
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
```

### 2. 项目界面

#### (1)电梯系统界面

&emsp;根据需求分析，可以设计电梯系统界面，界面分为5个部分，每个部分对应一个电梯。如下：

<img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E7%B3%BB%E7%BB%9F%E7%95%8C%E9%9D%A2.jpg?raw=true"/>



#### (2)电梯界面

电梯界面各部分表达的内容分为：梯外请求按钮与梯内请求按钮。如下：



<img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E7%94%B5%E6%A2%AF%E7%95%8C%E9%9D%A2.jpg?raw=true">

#### (3)电梯内部面板图

&emsp;电梯内部面板界面分为以下几个部分：显示楼层、显示上/下行状态、紧急键、开门键、关门键与内请求楼层键。如下：

<img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E7%94%B5%E6%A2%AF%E5%86%85%E9%83%A8%E9%9D%A2%E6%9D%BF%E5%9B%BE.jpg?raw=true"/>



#### (4)电梯开门示意图

&emsp;电梯开门时，门会向左侧滑动，有动画效果。

&emsp;示例为三楼电梯门打开。如下：

<img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E7%94%B5%E6%A2%AF%E5%BC%80%E9%97%A8%E7%A4%BA%E6%84%8F%E5%9B%BE.jpg?raw=true"/>

#### (5)电梯运行状态示意图

&emsp;当电梯启动，处于运行状态后，即可正常响应、实现请求，如下图：

<img src="https://github.com/GaoChongwen/ElevatorDispatch_OS_Assignment/blob/master/pic/%E7%94%B5%E6%A2%AF%E8%BF%90%E8%A1%8C%E7%8A%B6%E6%80%81%E7%A4%BA%E6%84%8F%E5%9B%BE.jpg?raw=true"/>

### #

## 六、提交内容

- 源代码
- 说明文档
