import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [inputDate, setInputDate] = useState('')
  const [dateList, setDateList] = useState('')

  // 计算上个周的周一日期
  const getLastMonday = () => {
    const today = new Date()
    const day = today.getDay() // 0表示周日，1表示周一，...，6表示周六
    
    // 计算本周一的日期（避免直接修改原日期对象）
    const monday = new Date(today)
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1))
    
    // 验证计算出的本周一确实是周一
    if (monday.getDay() !== 1) {
      console.error('计算本周一时出现错误，结果不是周一:', monday.toISOString().split('T')[0], '星期', monday.getDay())
    }
    
    // 再减去一周得到上个周的周一
    const lastMonday = new Date(monday)
    lastMonday.setDate(monday.getDate() - 7)
    
    // 验证计算出的上个周一是周一且早于本周一
    if (lastMonday.getDay() !== 1) {
      console.error('计算上个周一时出现错误，结果不是周一:', lastMonday.toISOString().split('T')[0], '星期', lastMonday.getDay())
    }
    
    if (lastMonday >= monday) {
      console.error('计算上个周一时出现错误，上个周一不应晚于本周一')
    }
    
    return lastMonday
  }

  // 组件加载时默认生成上个周的周一日期列表
  useEffect(() => {
    const lastMonday = getLastMonday()
    generateDateListFromDate(lastMonday)
  }, [])

  // 解析日期字符串的函数
  const parseDate = (dateString) => {
    // 处理不同的日期格式
    let parsedDate = null
    
    // 格式: 9/1, 9-1, 9.1
    const format1 = /^(\d{1,2})[/.-](\d{1,2})$/
    // 格式: 9月1日, 9月1号
    const format2 = /^(\d{1,2})月(\d{1,2})[日号]$/
    // 格式: 2023/9/1, 2023-9-1
    const format3 = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/
    
    if (format1.test(dateString)) {
      const match = dateString.match(format1)
      const month = parseInt(match[1], 10) - 1 // JS月份从0开始
      const day = parseInt(match[2], 10)
      parsedDate = new Date(new Date().getFullYear(), month, day)
    } else if (format2.test(dateString)) {
      const match = dateString.match(format2)
      const month = parseInt(match[1], 10) - 1
      const day = parseInt(match[2], 10)
      parsedDate = new Date(new Date().getFullYear(), month, day)
    } else if (format3.test(dateString)) {
      const match = dateString.match(format3)
      const year = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      const day = parseInt(match[3], 10)
      parsedDate = new Date(year, month, day)
    } else {
      // 如果没有匹配的格式，尝试直接用 Date 解析
      parsedDate = new Date(dateString)
    }
    
    // 如果日期无效，返回 null
    if (isNaN(parsedDate.getTime())) {
      return null
    }
    
    return parsedDate
  }

  // 为指定日期生成日期列表的函数
  const generateDateListFromDate = (startDate) => {
    if (!startDate || isNaN(startDate.getTime())) {
      alert('日期无效')
      return
    }
    
    let result = ''
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    
    // 保存开始日期的完整格式 (YYYY-MM-DD 星期)
    const startMonth = startDate.getMonth() + 1
    const startDay = startDate.getDate()
    const startWeekday = weekdays[startDate.getDay()]
    const fullStartDate = `${startDate.getFullYear()}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')} ${startWeekday}`
    
    for (let i = 0; i < 14; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const month = currentDate.getMonth() + 1
      const day = currentDate.getDate()
      const weekday = weekdays[currentDate.getDay()]
      
      // 保存现有格式用于显示和复制
      result += `${month}-${day}${weekday}\n`
    }
    
    // 将开始日期的完整格式保存在结果的最前面，用特殊标记分隔
    setDateList(`FULL_START_DATE:${fullStartDate}\n${result}`)
  }

  // 生成14天的日期列表（基于用户输入）
  const generateDateList = () => {
    const startDate = parseDate(inputDate)
    if (!startDate) {
      alert('请输入有效的日期格式，例如: 9/1 或 9月1日')
      return
    }
    
    generateDateListFromDate(startDate)
  }

  // 处理文本选择并自动复制
  const handleTextSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim() !== '') {
        // 获取选中的文本
        let selectedText = selection.toString()
        
        // 如果选中的文本包含开始日期信息，移除它
        if (selectedText.includes('开始日期:')) {
          const lines = selectedText.split('\n')
          // 过滤掉包含开始日期的行
          selectedText = lines.filter(line => !line.includes('开始日期:')).join('\n')
        }
        
        // 移除可能包含的 FULL_START_DATE 标记行
        if (selectedText.includes('FULL_START_DATE:')) {
          const lines = selectedText.split('\n')
          selectedText = lines.filter(line => !line.startsWith('FULL_START_DATE:')).join('\n')
        }
        
        // 自动复制处理后的文本到剪贴板
        navigator.clipboard.writeText(selectedText)
          .then(() => {
            console.log('选中的文本已复制到剪贴板')
          })
          .catch(err => {
            console.error('复制失败:', err)
          })
      }
    }, 100)
  }

  // 复制到剪贴板（带格式）
  const copyToClipboard = async () => {
    if (!dateList) {
      alert('请先生成日期列表')
      return
    }
    
    // 只复制月-日星期格式，不包含年份
    const lines = dateList.split('\n').filter(line => line.trim() !== '' && !line.startsWith('FULL_START_DATE:'))
    const displayText = lines.join('\n')
    
    // 构造HTML格式的表格数据，添加样式以便在Excel中更好地显示
    const htmlTable = `
      <table style="font-family: 微软雅黑; font-size: 10pt; text-align: center;">
        <tbody>
          ${lines.map(line => `<tr><td style="text-align: center; padding: 2px 0; border: 1px solid #ddd;">${line}</td></tr>`).join('')}
        </tbody>
      </table>
    `
    
    try {
      // 检查是否支持Clipboard API
      if (navigator.clipboard && navigator.clipboard.write) {
        // 使用Clipboard API同时提供多种格式
        const clipboardData = [
          new ClipboardItem({
            'text/plain': new Blob([displayText], { type: 'text/plain' }),
            'text/html': new Blob([htmlTable], { type: 'text/html' })
          })
        ]
        await navigator.clipboard.write(clipboardData)
        alert('已复制到剪贴板，粘贴到Excel中将保持表格格式和样式')
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        // 降级到普通文本复制（支持基础Clipboard API）
        await navigator.clipboard.writeText(displayText)
        alert('已复制到剪贴板（纯文本格式）')
      } else {
        // 使用传统方法作为最后的备选方案
        const textArea = document.createElement("textarea")
        textArea.value = displayText
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        alert('已复制到剪贴板（兼容模式）')
      }
    } catch (err) {
      console.error('复制失败:', err)
      
      // 尝试使用传统方法作为备选方案
      try {
        const textArea = document.createElement("textarea")
        textArea.value = displayText
        document.body.appendChild(textArea)
        textArea.select()
        const successful = document.execCommand("copy")
        document.body.removeChild(textArea)
        
        if (successful) {
          alert('已复制到剪贴板（兼容模式）')
        } else {
          throw new Error('传统复制方法也失败了')
        }
      } catch (fallbackErr) {
        console.error('备选复制方法也失败了:', fallbackErr)
        alert('复制失败，请手动复制以下内容：\n\n' + displayText)
      }
    }
  }

  return (
    <>
      <h1>日期生成器</h1>
      <div className="card">
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            value={inputDate} 
            onChange={(e) => setInputDate(e.target.value)} 
            placeholder="请输入日期 (如: 9/1 或 9月1日)" 
            style={{ 
              padding: '8px', 
              fontSize: '16px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              marginRight: '10px',
              width: '200px'
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={generateDateList}
            style={{ 
              padding: '8px 16px', 
              fontSize: '16px', 
              borderRadius: '4px', 
              border: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            生成14天日期
          </button>
          <button 
            onClick={copyToClipboard}
            style={{ 
              padding: '8px 16px', 
              fontSize: '16px', 
              borderRadius: '4px', 
              border: 'none',
              backgroundColor: '#008CBA',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            复制到剪贴板
          </button>
        </div>
        <div style={{ marginTop: '20px', textAlign: 'left' }}>
          <div 
            style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              userSelect: 'text',
              cursor: 'text'
            }}
            onMouseUp={handleTextSelection}
          >
            {/* 显示开始日期的完整格式 */}
            {dateList.startsWith('FULL_START_DATE:') && (
              <div style={{ 
                fontWeight: 'bold', 
                marginBottom: '10px', 
                padding: '5px', 
                backgroundColor: '#e0e0e0', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                开始日期: {dateList.split('\n')[0].replace('FULL_START_DATE:', '')}
              </div>
            )}
            
            {/* 可复制的日期列表 - 表格形式 */}
            <table 
              style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontFamily: '微软雅黑',
                fontSize: '10pt',
                textAlign: 'center',
                tableLayout: 'fixed'
              }}
            >
              <tbody>
                {dateList.split('\n').filter(line => line.trim() !== '' && !line.startsWith('FULL_START_DATE:')).map((line, index) => (
                  <tr key={index}>
                    <td 
                      style={{ 
                        padding: '2px 0',
                        userSelect: 'text',
                        textAlign: 'center',
                        border: '1px solid #ddd'
                      }}
                    >
                      {line}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
