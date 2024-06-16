import React, { useEffect, useState } from "react";
import "./style.css";
import { bitable, dashboard } from '@lark-base-open/js-sdk';

let configing = false

function c(className: any) {
  if (configing) {
    return className + " config"
  }
  return className
}

const stateStyleConfig = {
  finished: {
    color: "var(--finished)",
    text: "已完成"
  },
  unfinished: {
    color: "var(--unfinished)",
    text: "未完成"
  },
  overdueFinished: {
    color: "var(--overdueFinished)",
    text: "逾期已完成"
  },
  overdueUnfinished: {
    color: "var(--overdueUnfinished)",
    text: "逾期未完成"
  }
}

function abbrText(text: any) {
  if (text.length > 10)
    return text.slice(0, 10) + "...";
  return text;
}

function computeState(expectedTime: any, actualTime: any) {
  const nowTime = new Date().getTime();
  if (expectedTime && actualTime) {
    if (actualTime > expectedTime)
      return "overdueFinished";
    return "finished";
  }
  if (expectedTime && !actualTime) {
    if (expectedTime < nowTime)
      return "overdueUnfinished";
    return "unfinished";
  }
  return "unfinished";
}

function formatTime(time: any) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

function Item({ milestone, expectedTime, actualTime }: any) {
  const stateStyle = stateStyleConfig[computeState(expectedTime, actualTime)]
  return (
    <div className={c("item")} style={{ '--primaryColor': stateStyle.color } as React.CSSProperties}>
      <div className={c("milestone")}>{abbrText(milestone)}</div>
      <div className={c("circle")}></div>
      <div className={c("state")}>{stateStyle.text}</div>
      <div className={c("datetime")}>{formatTime(expectedTime)}</div>
    </div>
  )
}

export function DashboardView(props: any) {
  const { config, isConfig, t } = props;

  const [timelineData, setTimelineData] = useState([]) as any;
  useEffect(() => {
    configing = isConfig
  }, [isConfig])
  useEffect(() => {
    if (!config) return;
    const { milestoneFieldId, expectedTimeFieldId, actualTimeFieldId, selectedTableId } = config;
    (async () => {
      const table = await bitable.base.getTable(selectedTableId);
      const recordIdList = await table.getRecordIdList();
      const milestoneField = await table.getFieldById(milestoneFieldId)
      const expectedTimeField = await table.getFieldById(expectedTimeFieldId)
      const actualTimeField = await table.getFieldById(actualTimeFieldId)
      const dataTemp = []
      for (const recordId of recordIdList) {
        const record = await milestoneField.getValue(recordId);
        const expectedTime = await expectedTimeField.getValue(recordId);
        const actualTime = await actualTimeField.getValue(recordId);
        if (record && expectedTime) {
          dataTemp.push({ record: record[0].text, expectedTime, actualTime })
        }
      }
      // 按expectedTime排序
      dataTemp.sort((a: any, b: any) => a.expectedTime - b.expectedTime)
      setTimelineData(dataTemp)
    })()
  }, [config])

  return (
    <>
      <div className={c("space")}>
        <div className={c("timeline")}>
          <div className={c("itemBox")}>
            {timelineData.map((item: any, i: any) => <Item key={i} milestone={item.record} expectedTime={item.expectedTime} actualTime={item.actualTime} />)}
          </div>
        </div>
      </div>
    </>
  )
}