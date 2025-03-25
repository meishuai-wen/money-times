// 初始化Canvas
const canvas = document.getElementById('goldRain');
const ctx = canvas.getContext('2d');

// 聚宝盆元素
let bowl = null;
let isDragging = false;
let offsetX = 0;

// 设备尺寸适配
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 创建得分提示
function createScorePopup(x, y) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = '+1';
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  
  document.body.appendChild(popup);
  
  // 动画结束后移除元素
  setTimeout(() => {
    document.body.removeChild(popup);
  }, 1000);
}

// 计时器核心逻辑
let workStartTime = null;
let workEndTime = null;
let accumulated = 0;
const timerElement = document.getElementById('timer');
const salaryElement = document.getElementById('accumulated');

// 工资配置

const salaryDialog = () => {
  const modal = document.getElementById('configModal');
  modal.style.display = 'block';

  document.getElementById('configForm').onsubmit = (e) => {
    e.preventDefault();
    
    const timeConfig = {
      daily: document.getElementById('dailySalary').value,
      start: document.getElementById('startTime').value,
      end: document.getElementById('endTime').value
    };

  // 验证并存储配置
  if (timeConfig.daily && /^\d{2}:\d{2}$/.test(timeConfig.start) && /^\d{2}:\d{2}$/.test(timeConfig.end)) {
    dailySalary = parseFloat(timeConfig.daily) || 0;
    workStartTime = timeConfig.start;
    workEndTime = timeConfig.end;
    
    localStorage.setItem('workConfig', 
      JSON.stringify({
        dailySalary,
        workStartTime,
        workEndTime
      })
    );
    
    // 立即更新界面显示
    document.getElementById('workHours').textContent = 
      `工作时间：${workStartTime} - ${workEndTime}`;
    
// 全局配置对象
const GlobalConfig = {
  particles: {
    count: 100,
    baseSpeed: 1,
    sizeRange: [10, 20],
    resetPosition: -20
  },
  work: {
    dailySalary: 0,
    startTime: null,
    endTime: null,
    get workDuration() {
      return (GlobalConfig.work.endTime - GlobalConfig.work.startTime) || 8 * 3600000;
    }
  }
};

// 全局时间解析函数
const parseTime = (timeStr) => {
  if(!/^\d{2}:\d{2}$/.test(timeStr)) throw new Error('无效时间格式');
  const [hours, minutes] = timeStr.split(':').map(Number);
  if(hours > 23 || minutes > 59) throw new Error('时间数值越界');
  return new Date().setHours(hours, minutes, 0, 0);
};

const start = parseTime(workStartTime);
const end = parseTime(workEndTime);
    if (isNaN(start) || isNaN(end)) {
      throw new Error('无效的时间格式');
    }
    console.log('工作时间:', workStartTime, '到', workEndTime);
    console.log('时间差(小时):', (end - start)/3600000);
    const hours = (end - start) / 3600000;
    document.getElementById('hourlyRate').textContent = 
      (dailySalary / hours).toFixed(2);
    try {
    animate();
  } catch (e) {
    console.error('动画错误:', e);
    requestAnimationFrame(animate);
  }
  } else {
    document.getElementById('errorMsg').textContent = '请填写所有字段且时间格式为HH:mm';
    return false;
  }
  modal.style.display = 'none';
  document.getElementById('errorMsg').textContent = '';
  }
};

// 粒子系统
class GoldParticle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = -20;
    this.speed = 1 + Math.random() * 2;
    this.alpha = 1;
    this.size = (Math.random() < 0.9 ? 1 : 2) * (10 + Math.random() * 10);
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // 绘制金币外圆
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size/2, 0, Math.PI*2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    
    // 绘制内方孔
    const innerSize = this.size * 0.3;
    ctx.beginPath();
    ctx.rect(
      this.x - innerSize/2,
      this.y - innerSize/2,
      innerSize,
      innerSize
    );
    ctx.fillStyle = '#D4AF37';
    ctx.fill();
    
    // 添加装饰线条
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size/2 * 0.8, Math.PI/4, Math.PI*1.75);
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制外缘高光
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size/2 * 1.05, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }

  update() {
    this.y += this.speed;
    
    // 碰撞检测 - 检查是否与聚宝盆碰撞
    if (bowl && !this.collected) {
      const bowlRect = bowl.getBoundingClientRect();
      const particleX = this.x;
      const particleY = this.y;
      
      // 判断金币是否落入聚宝盆范围内
      if (particleY > bowlRect.top && 
          particleY < bowlRect.bottom && 
          particleX > bowlRect.left && 
          particleX < bowlRect.right) {
        
        // 标记为已收集
        this.collected = true;
        
        // 增加累计薪资
        if (dailySalary > 0) {
          accumulated += 1;
          salaryElement.textContent = accumulated.toFixed(2);
        }
        
        // 创建得分提示
        createScorePopup(particleX, particleY);
        
        // 重置粒子
        this.reset();
        return;
      }
    }
    
    // 如果超出屏幕底部，重置粒子
    if (this.y > canvas.height + 20) {
      this.reset();
      this.collected = false;
    }
  }
}

// 创建粒子池
const particles = Array(100).fill().map(() => new GoldParticle());

// 初始化聚宝盆拖拽功能
function initTreasureBowl() {
  bowl = document.getElementById('treasureBowl');
  
  // 鼠标按下事件
  bowl.addEventListener('mousedown', (e) => {
    isDragging = true;
    // 计算鼠标在元素内的偏移量
    offsetX = e.clientX - bowl.getBoundingClientRect().left;
  });
  
  // 鼠标移动事件
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // 计算新位置，限制在窗口范围内
    const newLeft = e.clientX - offsetX;
    const maxLeft = window.innerWidth - bowl.offsetWidth;
    
    // 限制聚宝盆只能在底部水平移动
    bowl.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
    bowl.style.transform = 'none'; // 移除默认的居中transform
  });
  
  // 鼠标释放事件
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // 触摸事件支持
  bowl.addEventListener('touchstart', (e) => {
    isDragging = true;
    offsetX = e.touches[0].clientX - bowl.getBoundingClientRect().left;
  });
  
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // 防止页面滚动
    
    const newLeft = e.touches[0].clientX - offsetX;
    const maxLeft = window.innerWidth - bowl.offsetWidth;
    
    bowl.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
    bowl.style.transform = 'none';
  });
  
  document.addEventListener('touchend', () => {
    isDragging = false;
  });
}

// 动画循环
function animate() {
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 始终更新粒子系统
    // 统一粒子更新逻辑
  particles.forEach(p => {
    p.update();
    p.draw();
  });

if(!workStartTime || !workEndTime) {
  return requestAnimationFrame(animate);
}

// 更新时间显示
const now = new Date();
const currentTime = now.getTime();
let ms = 0;
// 计算有效工作时间
let elapsed = 0;
if (workStartTime && workEndTime) {
  // 处理跨天工作时间
  const start = new Date(now);
  start.setHours(...workStartTime.split(':').map(Number));
  start.setMinutes(0,0,0);

  const end = new Date(start);
  end.setHours(...workEndTime.split(':').map(Number));
  if(end <= start) end.setDate(end.getDate()+1);
  if (isNaN(start) || isNaN(end)) return;
  ms = end.getTime() - start.getTime();
  if (now >= start && now <= end) {
    elapsed = currentTime - start.getTime();
  } else if (now > end) {
    elapsed = workDuration;
    // 触发下班祝贺
    document.getElementById('congratsModal').style.display = 'block';
    document.getElementById('countdown').textContent = '00:00:00';
    document.getElementById('finalAmount').textContent = accumulated.toFixed(2);
    localStorage.setItem('congratsShown', 'true');
    
    // 进入庆祝模式
    particles.forEach(p => {
      p.speed *= 2;
      p.size *= 1.5;
      p.alpha = 0.8;
    });
    
  }
}
  // const ms = elapsed % 1000;
  // const sec = Math.floor(elapsed / 1000) % 60;
  // const min = Math.floor(elapsed / 60000) % 60;
  // const hrs = Math.floor(elapsed / 3600000);
 
  
  timerElement.textContent = 
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

  // 更新工资
  if (dailySalary > 0) {
    const salaryPerMs = dailySalary / ms; // 按8小时工作制计算
    accumulated = elapsed * salaryPerMs;
    salaryElement.textContent = accumulated.toFixed(2);

  // 自由充能进度百分比逻辑
  if (workStartTime && workEndTime) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(...workStartTime.split(':').map(Number));
    start.setMinutes(0, 0, 0);
    
    const end = new Date(now);
    end.setHours(...workEndTime.split(':').map(Number));
    end.setMinutes(0, 0, 0);
    
    if (end <= start) end.setDate(end.getDate() + 1);
    
    // 计算进度百分比
    let progressPercent = 0;
    const totalWorkTime = end - start;
    
    if (totalWorkTime > 0) {
      if (now >= start && now <= end) {
        const elapsedTime = now - start;
        progressPercent = Math.round((elapsedTime / totalWorkTime) * 100);
      } else if (now > end) {
        progressPercent = 100;
      }
    }
    
    // 限制进度在0-100之间
    progressPercent = Math.max(0, Math.min(100, progressPercent));
    
    document.getElementById('countdown').innerHTML = `<span class="freedom-text">自由充能：</span>${progressPercent}%`;
  }
    // 带有效性检查的时间解析
// 全局配置对象
const GlobalConfig = {
  particles: {
    count: 100,
    baseSpeed: 1,
    sizeRange: [10, 20],
    resetPosition: -20
  },
  work: {
    dailySalary: 0,
    startTime: null,
    endTime: null,
    get workDuration() {
      return (GlobalConfig.work.endTime - GlobalConfig.work.startTime) || 8 * 3600000;
    }
  }
};

// 全局时间解析函数
const parseTime = (timeStr) => {
  if(!/^\d{2}:\d{2}$/.test(timeStr)) throw new Error('无效时间格式');
  const [hours, minutes] = timeStr.split(':').map(Number);
  if(hours > 23 || minutes > 59) throw new Error('时间数值越界');
  return new Date().setHours(hours, minutes, 0, 0);
};

const start = parseTime(workStartTime);
const end = parseTime(workEndTime);
    if (isNaN(start) || isNaN(end)) {
      throw new Error('无效的时间格式');
    }
    document.getElementById('hourlyRate').textContent = 
      (dailySalary / ((end - start) / 3600000)).toFixed(2);
  }

  // 更新粒子
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  } catch (e) {
    console.error('动画帧错误:', e);
  }
  requestAnimationFrame(animate);
}

// 初始化流程
document.addEventListener('DOMContentLoaded', () => {
  const savedConfig = localStorage.getItem('workConfig');
  if (!savedConfig) {
    document.getElementById('configModal').style.display = 'block';
  }
  
  // 初始化聚宝盆拖拽功能
  initTreasureBowl();
});
try {
  // 初始化本地配置
  document.addEventListener('DOMContentLoaded', () => {
    const savedConfig = localStorage.getItem('workConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        workStartTime = config.workStartTime;
        workEndTime = config.workEndTime;
        document.getElementById('workHours').textContent = 
          `工作时间：${workStartTime} - ${workEndTime}`;
        
        // 更新时薪显示
        const hours = (parseTime(workEndTime) - parseTime(workStartTime)) / 3600000;
        document.getElementById('hourlyRate').textContent = 
          (config.dailySalary / hours).toFixed(2);
      } catch (e) {
        console.error('配置解析错误:', e);
      }
    }
  });
  const savedConfig = localStorage.getItem('workConfig');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    dailySalary = config.dailySalary;
    workStartTime = config.workStartTime;
    workEndTime = config.workEndTime;
  } else {
    salaryDialog();
  }
} catch (e) {
  console.error('配置加载失败:', e);
  localStorage.removeItem('workConfig');
  salaryDialog();
}

animate();