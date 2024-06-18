import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import "./style.css";
import { DashboardState, FieldType, base, bitable, dashboard } from '@lark-base-open/js-sdk';
import { Button, Input, Select, Toast } from "@douyinfe/semi-ui";

let isInited = false

function FieldSelect({ t, fieldList, promptTKey, fieldId, setFieldId, fieldType, placeholder }: any) {
  return (<>
    <div className="prompt">{t(promptTKey)}</div>
    <Select placeholder={t(placeholder)} className="select" optionList={
      fieldList.filter((v: any, i: any) => {
        return v.fieldType == fieldType
      }).map((v: any, i: any) => {
        return {
          "label": v.fieldName,
          "value": v.fieldId
        }
      })
    } onChange={(e) => {
      setFieldId(e)
    }} value={fieldId}></Select >
  </>
  )
}

function DashboardConfig(props: any, ref: any) {
  const isCreate = dashboard.state === DashboardState.Create

  const { config, setConfig, t, onConfigChange } = props;
  const [tableList, setTableList] = useState([]) as any;
  const [selectedTableId, setSelectedTableId] = useState(null) as any;
  const [fieldList, setFieldList] = useState([]) as any;

  const [milestoneFieldId, setMilestoneFieldId] = useState(null) as any;
  const [expectedTimeFieldId, setExpectedTimeFieldId] = useState(null) as any;
  const [actualTimeFieldId, setActualTimeFieldId] = useState(null) as any;

  if (config)
    useEffect(() => {
      if (selectedTableId && milestoneFieldId && expectedTimeFieldId && actualTimeFieldId) {
        // 通知view部分实时渲染
        onConfigChange({
          milestoneFieldId: milestoneFieldId,
          expectedTimeFieldId: expectedTimeFieldId,
          actualTimeFieldId: actualTimeFieldId,
          selectedTableId: selectedTableId,
        })
      }
    }, [selectedTableId, milestoneFieldId, expectedTimeFieldId, actualTimeFieldId]);

  useEffect(() => {
    if (isInited) return;
    if (isCreate) { // 创建状态时设置默认值
      (async () => {
        const tables = await bitable.base.getTableList();
        if (tables.length == 0) return
        setSelectedTableId(tables[0].id);
        onSelect(tables[0].id, undefined)?.then((_fieldList) => {
          let _milestoneFieldId = false;
          let _expectedTimeFieldId = false;
          let _actualTimeFieldId = false;
          for (const field of _fieldList.reverse()) {
            if (!_milestoneFieldId) {
              setMilestoneFieldId(field['fieldId'])
              _milestoneFieldId = true
              continue
            }
            if (field.fieldType != FieldType.DateTime) continue;
            if (!_expectedTimeFieldId) {
              setExpectedTimeFieldId(field['fieldId'])
              _expectedTimeFieldId = true
              continue
            }
            if (!_actualTimeFieldId) {
              setActualTimeFieldId(field['fieldId'])
              _actualTimeFieldId = true
            }
          }

        });

      })();
    }
    if (!config) return; // 配置状态时使用config值
    if (config.selectedTableId) setSelectedTableId(config.selectedTableId);
    dashboard.getCategories(config.selectedTableId).then(e => {
      setFieldList(e)
      if (config.milestoneFieldId) setMilestoneFieldId(config.milestoneFieldId);
      if (config.expectedTimeFieldId) setExpectedTimeFieldId(config.expectedTimeFieldId);
      if (config.actualTimeFieldId) setActualTimeFieldId(config.actualTimeFieldId);
      isInited = true
    })
  }, [config])

  useEffect(() => {
    (async () => {
      const tables = await bitable.base.getTableList();
      setTableList(
        await Promise.all(
          tables.map(
            async table => {
              const name = await table.getName();
              return {
                tableId: table.id,
                tableName: name
              }
            }
          )
        )
      )
    })();
  }, [])

  function onSelect(value: any, option: any) {
    if (!value) return
    return (async () => {
      setMilestoneFieldId(null)
      setExpectedTimeFieldId(null)
      setActualTimeFieldId(null)
      const _fieldList = await dashboard.getCategories(value)
      setFieldList(_fieldList)
      return _fieldList
    })();
  }

  useImperativeHandle(ref, () => ({
    handleSetConfig() {
      if (!(milestoneFieldId && expectedTimeFieldId && actualTimeFieldId)) {
        Toast.error({
          content: t('toast.error')
        })
        return false
      }
      const cfg = {
        milestoneFieldId: milestoneFieldId,
        expectedTimeFieldId: expectedTimeFieldId,
        actualTimeFieldId: actualTimeFieldId,
        selectedTableId: selectedTableId,
      }
      setConfig(cfg)

      return cfg
    }
  }));

  return (
    <>
      <div className="prompt">{t('tableSource')}</div>
      <Select placeholder={t('placeholder.pleaseSelectTable')} className="select" optionList={
        tableList.map((v: any) => { return { label: v.tableName, value: v.tableId } })
      } onChange={(e) => { setSelectedTableId(e) }} value={selectedTableId} onSelect={onSelect}></Select>

      <FieldSelect t={t} fieldList={fieldList} promptTKey='field.milestone' fieldId={milestoneFieldId} setFieldId={setMilestoneFieldId} fieldType={FieldType.Text} placeholder="placeholder.pleaseSelectField"></FieldSelect>
      <FieldSelect t={t} fieldList={fieldList} promptTKey='field.expectedTime' fieldId={expectedTimeFieldId} setFieldId={setExpectedTimeFieldId} fieldType={FieldType.DateTime} placeholder="placeholder.pleaseSelectDateField"></FieldSelect>
      <FieldSelect t={t} fieldList={fieldList} promptTKey='field.actualTime' fieldId={actualTimeFieldId} setFieldId={setActualTimeFieldId} fieldType={FieldType.DateTime} placeholder="placeholder.pleaseSelectDateField"></FieldSelect>
      <div className="title">
        <div className="titlet">
          <a className="help" href="https://wingahead.feishu.cn/wiki/NjoJwa38WidGiikx8i2cyUeKnsd?from=from_copylink" target="_blank" rel="noopener noreferrer">帮助文档</a>
        </div>
      </div>
    </>
  )
}

export default React.forwardRef(DashboardConfig)