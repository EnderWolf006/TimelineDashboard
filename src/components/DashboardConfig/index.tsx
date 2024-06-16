import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import "./style.css";
import { FieldType, base, bitable, dashboard } from '@lark-base-open/js-sdk';
import { Input, Select, Toast } from "@douyinfe/semi-ui";

let isInited = false

function FieldSelect({ t, fieldList, promptTKey, fieldId, setFieldId, fieldType }: any) {
  return (<>
    <div className="prompt">{t(promptTKey)}</div>
    <Select placeholder={t('placeholder.pleaseSelectField')} size="large" className="select" optionList={
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

  const { config, setConfig, t } = props;
  const [tableList, setTableList] = useState([]) as any;
  const [selectedTableId, setSelectedTableId] = useState(null) as any;
  const [fieldList, setFieldList] = useState([]) as any;

  const [milestoneFieldId, setMilestoneFieldId] = useState(null) as any;
  const [expectedTimeFieldId, setExpectedTimeFieldId] = useState(null) as any;
  const [actualTimeFieldId, setActualTimeFieldId] = useState(null) as any;


  useEffect(() => {
    if (isInited) return;
    if (!config) return;
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
    (async () => {
      setMilestoneFieldId(null)
      setExpectedTimeFieldId(null)
      setActualTimeFieldId(null)
      setFieldList(await dashboard.getCategories(value))
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
      <div className="title">{t('title')}</div>

      <div className="prompt">{t('tableSource')}</div>
      <Select placeholder={t('placeholder.pleaseSelectTable')} size="large" className="select" optionList={
        tableList.map((v: any) => { return { label: v.tableName, value: v.tableId } })
      } onChange={(e) => { setSelectedTableId(e) }} value={selectedTableId} onSelect={onSelect}></Select>

      <FieldSelect t={t} fieldList={fieldList} promptTKey='field.milestone' fieldId={milestoneFieldId} setFieldId={setMilestoneFieldId} fieldType={FieldType.Text}></FieldSelect>
      <FieldSelect t={t} fieldList={fieldList} promptTKey='field.expectedTime' fieldId={expectedTimeFieldId} setFieldId={setExpectedTimeFieldId} fieldType={FieldType.DateTime}></FieldSelect>
      <FieldSelect t={t} fieldList={fieldList} promptTKey='field.actualTime' fieldId={actualTimeFieldId} setFieldId={setActualTimeFieldId} fieldType={FieldType.DateTime}></FieldSelect>
    </>
  )
}

export default React.forwardRef(DashboardConfig)