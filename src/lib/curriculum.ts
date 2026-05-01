import { ProgressState, Subject } from "@/types/study";
import { isSameOrAfter } from "@/lib/date";

export interface CurriculumUnit {
  id: string;
  subject: Subject;
  resource: string;
  stage: string;
  unit: string;
  title: string;
  focus: string;
  practice: string;
  checkpoint: string;
  reviewPrompt: string;
}

export interface CurriculumFocus extends CurriculumUnit {
  statusText: string;
}

const mathCalculusUnits: CurriculumUnit[] = [
  {
    id: "math-calculus-01",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第1讲",
    title: "函数、极限与连续",
    focus: "把定义、常见等价无穷小和连续性判定整理成方法卡片。",
    practice: "张宇1000题对应基础题，优先限时完成选择填空。",
    checkpoint: "极限计算步骤、间断点分类、等价替换使用条件。",
    reviewPrompt: "睡前复盘极限题的第一步判断：代入、变形、等价、洛必达。"
  },
  {
    id: "math-calculus-02",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第2讲",
    title: "导数与微分基础",
    focus: "抓住导数定义、可导与连续关系、复合函数求导链条。",
    practice: "张宇1000题对应求导和微分基础题，错题标出卡在哪一步。",
    checkpoint: "导数定义题、隐函数求导、参数方程求导。",
    reviewPrompt: "回顾可导、连续、极限存在之间的条件关系。"
  },
  {
    id: "math-calculus-03",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第3讲",
    title: "微分中值定理",
    focus: "重点理解罗尔、拉格朗日、柯西中值定理的构造思路。",
    practice: "对应证明题和中值定理应用题，每题写出辅助函数来源。",
    checkpoint: "闭区间条件、端点相等、辅助函数构造。",
    reviewPrompt: "睡前默写三类中值定理适用条件和常见构造模板。"
  },
  {
    id: "math-calculus-04",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第4讲",
    title: "导数应用",
    focus: "用导数处理单调性、极值、凹凸性、渐近线和方程根。",
    practice: "张宇1000题对应导数应用题，整理图像分析错题。",
    checkpoint: "单调区间、极值点、拐点、零点个数。",
    reviewPrompt: "复盘一道导数综合题，把表格法和图像法串起来。"
  },
  {
    id: "math-calculus-05",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第5讲",
    title: "不定积分",
    focus: "换元积分、分部积分和有理函数积分要形成题型识别。",
    practice: "张宇1000题不定积分基础到中档题，错题标注使用了哪种积分法。",
    checkpoint: "第一类换元、第二类换元、分部积分选u原则。",
    reviewPrompt: "睡前回顾5道典型积分的第一步变形。"
  },
  {
    id: "math-calculus-06",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第6讲",
    title: "定积分及反常积分",
    focus: "理解定积分性质、变限积分、对称性和反常积分敛散判断。",
    practice: "张宇1000题定积分对应题，优先做性质题和变限积分题。",
    checkpoint: "变限积分求导、区间对称、反常积分比较判别。",
    reviewPrompt: "复盘定积分题为什么先看区间、奇偶性和被积函数结构。"
  },
  {
    id: "math-calculus-07",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第7讲",
    title: "定积分应用",
    focus: "面积、体积、弧长和物理应用题要先画区域再列式。",
    practice: "对应应用题，所有错题补画图并写清积分变量。",
    checkpoint: "旋转体体积、平面图形面积、积分变量选择。",
    reviewPrompt: "睡前回顾应用题建模步骤：画图、切片、列式、计算。"
  },
  {
    id: "math-calculus-08",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第8讲",
    title: "多元函数微分学",
    focus: "偏导、全微分、极值和条件极值要区分清楚。",
    practice: "对应偏导和极值题，整理拉格朗日乘数法步骤。",
    checkpoint: "可微条件、复合函数偏导、条件极值。",
    reviewPrompt: "复盘多元函数题先判断求偏导、全微分还是极值。"
  },
  {
    id: "math-calculus-09",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第9讲",
    title: "二重积分",
    focus: "重点练习积分区域改写、换序和极坐标。",
    practice: "张宇1000题二重积分对应题，每道题保留区域草图。",
    checkpoint: "直角坐标换序、极坐标区域、对称性简化。",
    reviewPrompt: "睡前复盘一个区域从图像到积分限的过程。"
  },
  {
    id: "math-calculus-10",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第10讲",
    title: "曲线曲面积分",
    focus: "区分第一类和第二类积分，记清格林公式、高斯公式的使用条件。",
    practice: "对应曲线曲面积分基础题，错题写明公式使用前提。",
    checkpoint: "方向、法向、区域边界、公式适用条件。",
    reviewPrompt: "回顾曲线积分题如何判断是否能用格林公式。"
  },
  {
    id: "math-calculus-11",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第11讲",
    title: "级数基础",
    focus: "数项级数敛散性判别要先识别正项、交错、任意项。",
    practice: "对应级数判别题，错题归类到比较、比值、根值、莱布尼茨。",
    checkpoint: "必要条件、比较判别、比值判别、绝对/条件收敛。",
    reviewPrompt: "睡前默写级数判别的优先顺序。"
  },
  {
    id: "math-calculus-12",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第12讲",
    title: "幂级数与函数展开",
    focus: "掌握收敛半径、收敛域和常用泰勒展开。",
    practice: "对应幂级数题，整理常用展开式清单。",
    checkpoint: "收敛半径、端点判断、逐项求导积分。",
    reviewPrompt: "回顾 e^x、sin x、cos x、ln(1+x) 的展开。"
  },
  {
    id: "math-calculus-13",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第13讲",
    title: "微分方程",
    focus: "一阶方程、可降阶方程和二阶常系数方程要按类型求解。",
    practice: "对应微分方程题，错题标注方程类型和通解结构。",
    checkpoint: "变量可分离、齐次方程、线性方程、特征根。",
    reviewPrompt: "睡前复盘不同方程类型的第一步处理。"
  },
  {
    id: "math-calculus-14",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第14讲",
    title: "空间解析几何",
    focus: "向量、平面、直线和二次曲面要建立空间想象。",
    practice: "对应空间解析题，补画直线平面位置关系图。",
    checkpoint: "法向量、方向向量、点到平面距离、夹角。",
    reviewPrompt: "回顾平面与直线方程的互相转换。"
  },
  {
    id: "math-calculus-15",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第15讲",
    title: "高数证明题方法",
    focus: "把极限、导数、中值定理、积分证明题按构造方法归类。",
    practice: "挑选对应证明题，重点写完整逻辑链而不是只看答案。",
    checkpoint: "辅助函数、单调性、积分不等式、放缩。",
    reviewPrompt: "复盘一道证明题的构造来源。"
  },
  {
    id: "math-calculus-16",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第16讲",
    title: "高数综合应用",
    focus: "将函数性质、积分、微分方程和应用题串联训练。",
    practice: "对应综合题，限时后再订正，记录失分原因。",
    checkpoint: "题型识别、计算稳定性、条件转化。",
    reviewPrompt: "睡前总结今天最容易卡住的一个综合题入口。"
  },
  {
    id: "math-calculus-17",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第17讲",
    title: "高数重点串讲",
    focus: "以错题为中心，把高频题型和方法卡片补齐。",
    practice: "二刷前面高数错题，按极限、导数、积分、多元、级数分类。",
    checkpoint: "错因归类、公式使用条件、计算易错点。",
    reviewPrompt: "复盘一个错题类别，写出以后遇到同类题的处理顺序。"
  },
  {
    id: "math-calculus-18",
    subject: "math",
    resource: "张宇30讲",
    stage: "高数一轮",
    unit: "高数第18讲",
    title: "高数一轮收束",
    focus: "补齐高数遗留题和错题，形成进入线代前的清单。",
    practice: "高数错题二刷+1000题遗留题清理。",
    checkpoint: "未掌握公式、薄弱题型、二刷优先级。",
    reviewPrompt: "整理高数一轮遗留清单，标出线代开始前必须补的内容。"
  }
];

const mathLinearUnits: CurriculumUnit[] = [
  unit("math-linear-01", "math", "张宇30讲", "线代一轮", "线代第1单元", "行列式", "先掌握行列式性质和展开计算。", "线代对应基础题，重点练计算稳定性。", "性质、展开、特殊行列式。"),
  unit("math-linear-02", "math", "张宇30讲", "线代一轮", "线代第2单元", "矩阵", "掌握矩阵运算、逆矩阵、初等变换。", "矩阵运算和初等变换题。", "可逆条件、秩、初等矩阵。"),
  unit("math-linear-03", "math", "张宇30讲", "线代一轮", "线代第3单元", "向量组与秩", "理清线性相关、极大无关组和秩的关系。", "向量组判定题和秩计算题。", "线性相关、秩、等价向量组。"),
  unit("math-linear-04", "math", "张宇30讲", "线代一轮", "线代第4单元", "线性方程组", "区分齐次和非齐次解结构。", "方程组解的判定和通解题。", "基础解系、通解、参数条件。"),
  unit("math-linear-05", "math", "张宇30讲", "线代一轮", "线代第5单元", "特征值与特征向量", "掌握特征值、相似、对角化条件。", "特征值和对角化对应题。", "相似条件、可对角化、特征向量。"),
  unit("math-linear-06", "math", "张宇30讲", "线代一轮", "线代第6单元", "二次型", "把合同变换、正定判定和标准形串起来。", "二次型标准化和正定判定题。", "合同、正定、惯性指数。")
];

const mathProbabilityUnits: CurriculumUnit[] = [
  unit("math-prob-01", "math", "张宇30讲", "概率论一轮", "概率第1单元", "随机事件与概率", "先建立事件运算、条件概率和独立性的判断框架。", "概率基础题和条件概率题。", "事件关系、全概率、贝叶斯。"),
  unit("math-prob-02", "math", "张宇30讲", "概率论一轮", "概率第2单元", "一维随机变量", "掌握分布函数、常见离散/连续分布。", "随机变量分布题。", "分布函数、密度、常见分布。"),
  unit("math-prob-03", "math", "张宇30讲", "概率论一轮", "概率第3单元", "多维随机变量", "重点练联合分布、边缘分布、条件分布和独立性。", "二维随机变量对应题。", "边缘、条件、独立、区域积分。"),
  unit("math-prob-04", "math", "张宇30讲", "概率论一轮", "概率第4单元", "数字特征", "把期望、方差、协方差和相关系数公式用熟。", "数字特征计算题。", "期望性质、方差公式、协方差。"),
  unit("math-prob-05", "math", "张宇30讲", "概率论一轮", "概率第5单元", "大数定律与中心极限定理", "理解定理适用场景，训练近似计算。", "极限定理应用题。", "独立同分布、标准化、近似。"),
  unit("math-prob-06", "math", "张宇30讲", "概率论一轮", "概率第6单元", "数理统计初步", "掌握抽样分布、估计和常见统计量。", "统计量和估计题。", "样本均值、样本方差、估计量。")
];

const csOsUnits: CurriculumUnit[] = [
  csUnit("cs-os-01", "操作系统一轮", "操作系统第1章", "计算机系统概述", "建立操作系统功能、特征和中断异常的框架。", "王道操作系统第1章选择题+错题订正。", "系统调用、中断、内核态/用户态。"),
  csUnit("cs-os-02", "操作系统一轮", "操作系统第2章", "进程与线程", "重点理解进程状态、PCB、线程模型和上下文切换。", "王道操作系统第2章课后题，先做进程状态转换题。", "进程状态、线程、调度时机。"),
  csUnit("cs-os-03", "操作系统一轮", "操作系统第3章", "处理机调度", "掌握调度算法指标和典型算法计算。", "调度算法计算题，整理周转时间和等待时间公式。", "FCFS、SJF、优先级、时间片轮转。"),
  csUnit("cs-os-04", "操作系统一轮", "操作系统第4章", "同步与互斥", "这是408高频难点，PV操作要写过程而不是只看答案。", "王道同步互斥题，至少手写2道PV过程。", "临界区、信号量、生产者消费者。"),
  csUnit("cs-os-05", "操作系统一轮", "操作系统第5章", "死锁", "区分死锁条件、预防、避免、检测和解除。", "银行家算法和资源分配图题。", "安全序列、银行家算法、死锁条件。"),
  csUnit("cs-os-06", "操作系统一轮", "操作系统第6章", "内存管理", "重点掌握分页、分段、虚拟内存和页面置换。", "页面置换和地址转换计算题。", "页表、TLB、缺页、置换算法。"),
  csUnit("cs-os-07", "操作系统一轮", "操作系统第7章", "文件管理", "建立文件结构、目录结构和磁盘分配方式框架。", "文件管理选择题和计算题。", "索引分配、目录、空闲空间管理。"),
  csUnit("cs-os-08", "操作系统一轮", "操作系统第8章", "I/O管理", "理解I/O控制方式、缓冲和磁盘调度。", "磁盘调度算法题和I/O管理选择题。", "中断、DMA、缓冲、磁盘调度。")
];

const csCoaUnits: CurriculumUnit[] = [
  csUnit("cs-coa-01", "计组一轮", "计组第1章", "计算机系统概述", "梳理层次结构、性能指标和冯诺依曼结构。", "王道计组第1章基础题。", "CPI、MIPS、吞吐率、层次结构。"),
  csUnit("cs-coa-02", "计组一轮", "计组第2章", "数据表示和运算", "重点突破补码、浮点数和定点运算。", "数据表示计算题，错题写明位数和范围。", "补码、溢出、浮点规格化。"),
  csUnit("cs-coa-03", "计组一轮", "计组第3章", "存储系统", "掌握Cache、主存、虚拟存储的映射和计算。", "Cache命中率和地址划分题。", "Cache映射、替换、写策略。"),
  csUnit("cs-coa-04", "计组一轮", "计组第4章", "指令系统", "理解指令格式、寻址方式和CISC/RISC。", "寻址方式和指令格式题。", "操作码、地址码、寻址方式。"),
  csUnit("cs-coa-05", "计组一轮", "计组第5章", "中央处理器", "建立数据通路、控制器和流水线框架。", "CPU数据通路和流水线题。", "控制信号、流水线冲突、性能计算。"),
  csUnit("cs-coa-06", "计组一轮", "计组第6章", "总线", "掌握总线分类、仲裁、定时和带宽计算。", "总线带宽和仲裁题。", "同步/异步定时、带宽、仲裁。"),
  csUnit("cs-coa-07", "计组一轮", "计组第7章", "输入输出系统", "区分程序查询、中断、DMA和通道。", "I/O方式对比题和中断计算题。", "中断周期、DMA、I/O接口。")
];

const csNetworkUnits: CurriculumUnit[] = [
  csUnit("cs-net-01", "计网一轮", "计网第1章", "计算机网络体系结构", "建立OSI/TCP-IP分层和性能指标框架。", "王道计网第1章基础题。", "协议、服务、接口、时延。"),
  csUnit("cs-net-02", "计网一轮", "计网第2章", "物理层", "掌握编码、调制、传输介质和信道容量。", "物理层计算题。", "奈奎斯特、香农、码元、带宽。"),
  csUnit("cs-net-03", "计网一轮", "计网第3章", "数据链路层", "重点练差错控制、流量控制和MAC协议。", "CRC、滑动窗口和CSMA/CD题。", "帧、CRC、窗口、MAC。"),
  csUnit("cs-net-04", "计网一轮", "计网第4章", "网络层", "掌握IP、路由、子网划分和ARP/ICMP。", "IP地址划分和路由表题。", "子网掩码、最长前缀、NAT、ARP。"),
  csUnit("cs-net-05", "计网一轮", "计网第5章", "传输层", "重点理解TCP可靠传输、拥塞控制和UDP。", "TCP序号、确认、窗口和拥塞控制题。", "三次握手、四次挥手、拥塞窗口。"),
  csUnit("cs-net-06", "计网一轮", "计网第6章", "应用层", "梳理DNS、HTTP、SMTP、FTP等典型协议。", "应用层协议对比题。", "DNS解析、HTTP报文、邮件协议。")
];

function unit(
  id: string,
  subject: Subject,
  resource: string,
  stage: string,
  unitLabel: string,
  title: string,
  focus: string,
  practice: string,
  checkpoint: string
): CurriculumUnit {
  return {
    id,
    subject,
    resource,
    stage,
    unit: unitLabel,
    title,
    focus,
    practice,
    checkpoint,
    reviewPrompt: `复盘${checkpoint}，把还不稳的点写进今日总结。`
  };
}

function csUnit(
  id: string,
  stage: string,
  unitLabel: string,
  title: string,
  focus: string,
  practice: string,
  checkpoint: string
): CurriculumUnit {
  return unit(id, "cs408", "王道408", stage, unitLabel, title, focus, practice, checkpoint);
}

function byOneBasedIndex(units: CurriculumUnit[], index: number) {
  return units[Math.max(0, Math.min(index - 1, units.length - 1))];
}

export function getMathFocus(progress: ProgressState): CurriculumFocus {
  if (!progress.math.calculusDone) {
    const nextLecture = Math.min(progress.math.currentLecture + 1, mathCalculusUnits.length);
    return {
      ...byOneBasedIndex(mathCalculusUnits, nextLecture),
      statusText: `当前已到第${progress.math.currentLecture}讲，下一步推进第${nextLecture}讲`
    };
  }

  if (!progress.math.linearDone) {
    const unitIndex = Math.min((progress.math.linearUnit ?? 0) + 1, mathLinearUnits.length);
    return {
      ...byOneBasedIndex(mathLinearUnits, unitIndex),
      statusText: progress.math.linearStarted
        ? `线代已完成${progress.math.linearUnit ?? 0}个单元，下一步第${unitIndex}单元`
        : "高数完成后应启动线代一轮"
    };
  }

  if (!progress.math.probabilityDone) {
    const unitIndex = Math.min((progress.math.probabilityUnit ?? 0) + 1, mathProbabilityUnits.length);
    return {
      ...byOneBasedIndex(mathProbabilityUnits, unitIndex),
      statusText: progress.math.probabilityStarted
        ? `概率论已完成${progress.math.probabilityUnit ?? 0}个单元，下一步第${unitIndex}单元`
        : "线代完成后应启动概率论"
    };
  }

  return {
    ...mathCalculusUnits[mathCalculusUnits.length - 1],
    stage: "数学一轮回顾",
    unit: "综合复盘",
    title: "高数、线代、概率错题闭环",
    focus: "围绕错题和薄弱题型做二刷，不再平均用力。",
    practice: "按薄弱点清单二刷张宇1000题和教材例题。",
    checkpoint: "错因、方法、公式条件、计算稳定性。",
    reviewPrompt: "把仍然不会的题整理成强化阶段清单。",
    statusText: "一轮主体已完成，进入综合回顾"
  };
}

export function getCs408Focus(progress: ProgressState): CurriculumFocus {
  if (!progress.cs408.osDone) {
    return {
      ...byOneBasedIndex(csOsUnits, progress.cs408.osChapter),
      statusText: `操作系统第${progress.cs408.osChapter}章推进中`
    };
  }
  if (!progress.cs408.coaDone) {
    return {
      ...byOneBasedIndex(csCoaUnits, progress.cs408.coaChapter),
      statusText: `计组第${progress.cs408.coaChapter}章推进中`
    };
  }
  if (!progress.cs408.networkDone) {
    return {
      ...byOneBasedIndex(csNetworkUnits, progress.cs408.networkChapter),
      statusText: `计网第${progress.cs408.networkChapter}章推进中`
    };
  }

  return {
    ...csOsUnits[0],
    stage: "408整体回顾",
    unit: "四科综合",
    title: "数据结构、操作系统、计组、计网错题闭环",
    focus: "按四科薄弱点回到教材和王道题，补齐只听课没做题的部分。",
    practice: "每天至少完成一个章节错题块，优先数据结构遗留题和操作系统高频题。",
    checkpoint: "概念辨析、算法过程、计算题模板、错题归因。",
    reviewPrompt: "复盘今天最容易混淆的408概念，并写出反例。",
    statusText: "408一轮主体已完成，进入四科回顾"
  };
}

export function getEnglishFocus(progress: ProgressState, date: string): CurriculumFocus {
  const readingActive = progress.english.readingStarted || isSameOrAfter(date, progress.english.readingStartDate);
  if (!readingActive) {
    return {
      id: "english-pre-reading",
      subject: "english",
      resource: "单词书 + 田静每日一句",
      stage: "英语基础连续性",
      unit: "每日基础",
      title: "单词、旧词复习与长难句",
      focus: "保持单词和田静每日一句不断线，长难句要拆主干和修饰成分。",
      practice: "每日一句完整分析：划主干、翻译、记录生词和固定搭配。",
      checkpoint: "单词复习、句子主干、翻译顺序、生词回看。",
      reviewPrompt: "睡前回顾今天句子的主干和一个生词搭配。",
      statusText: `阅读计划 ${progress.english.readingStartDate} 启动前，先稳住单词和句子`
    };
  }

  return {
    id: "english-reading",
    subject: "english",
    resource: "英语一早年真题 + 田静每日一句",
    stage: "阅读启动期",
    unit: `阅读第${progress.english.readingPassages + 1}篇`,
    title: "早年真题阅读精读",
    focus: "阅读不追求速度，先建立定位、长难句和错因分析流程。",
    practice: "完成半篇到一篇早年真题阅读，整理题干定位、错因和生词。",
    checkpoint: "定位句、转折词、选项偷换、长难句翻译。",
    reviewPrompt: "复盘一道错题，写清楚错在定位、理解还是选项辨析。",
    statusText: `已完成阅读${progress.english.readingPassages}篇，继续小步精读`
  };
}

export function getCurriculumFocuses(progress: ProgressState, date: string): CurriculumFocus[] {
  return [getMathFocus(progress), getCs408Focus(progress), getEnglishFocus(progress, date)];
}
