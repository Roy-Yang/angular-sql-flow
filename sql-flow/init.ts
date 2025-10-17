
import { Injectable, OnInit } from '@angular/core';
import localData from './data.json';
import visoConfig from './config';

// 类型定义（复用原接口，适配 Angular 环境）
interface Column {
  id: any;
  name: string;
}

export interface Node {
  id: string;
  name: string;
  type: 'Origin' | 'Middle' | 'UNION' | 'RS';
  top: number;
  left: number;
  columns: Column[];
}

interface RelationSourceTarget {
  parentName: string;
  column: string;
}

export interface Relation {
  source: RelationSourceTarget;
  target: RelationSourceTarget;
}

interface VisoConfig {
  baseStyle: any;
}

// 注入 JQuery、jsPlumb、Mustache（需在 angular.json 中配置对应脚本）
declare const $: any;
declare const jsPlumb: any;
declare const Mustache: any;

@Injectable({
  providedIn: 'root' // 根注入，全应用可用
})
export class DataLineageService implements OnInit {
  private jsonData: any = null;
  private jsPlumbInstance: any; // jsPlumb 实例
  private readonly areaId = '#bg'; // 容器选择器


  constructor() { }

  ngOnInit(): void {
    // 初始化 jsPlumb 实例
  }

  /**
   * 初始化 jsPlumb 实例，配置默认参数
   */
  private initJsPlumbInstance(): void {
    this.jsPlumbInstance = jsPlumb.getInstance();
    // 配置 jsPlumb 默认值
    this.jsPlumbInstance.importDefaults({
      ConnectionsDetachable: false
    });
    // 设置容器（需在组件视图初始化后调用，避免 DOM 未加载）
    this.jsPlumbInstance.setContainer('bg');
  }

  /**
   * 核心方法：初始化数据血缘可视化
   * @param useLocalData 是否使用本地数据（true：本地 data.json；false：接口请求）
   */
  public async initDataLineage(id: string, useLocalData: boolean = true): Promise<void> {
    this.initJsPlumbInstance();

    if (useLocalData) {
      // 使用本地数据
      this.jsonData = localData;
      this.drawData(this.jsonData);
    } else {
      // 获取服务器数据
      // const res = await this.getLineageData()
      // this.jsonData = await this.buildJSONData(res?.data?.graph[0]?.data || null)
      // this.drawData(this.jsonData);
    }
  }

  private buildJSONData(data: any) {
    const result: any = {
      relations: [

      ],
      nodes: []
    }

    if (!data) return result
    result.relations = []

    data.inputs.forEach((item: any, i: number) => {
      result.relations.push({
        "source": {
          "column": "descripton",
          "parentName": item.name?.split(".").join("")
        },
        "target": {
          "column": "descripton",
          "parentName": data?.id?.name?.split(".").join("")
        }
      })

      result.nodes.push({
        "id": item.name?.split(".").join(""),
        "name": item.name?.split(".").join(""),
        "type": "Origin",
        "columns": [
          {
            "name": item.descripton || 'descripton',
            "id": "descripton"
          },
        ],
        "top": i === 0 ? 50 : 155 * i + 50,
        "left": 150
      })
    })

    result.nodes.push({
      "id": data?.id?.name?.split(".").join(""),
      "name": data?.id?.name?.split(".").join(""),
      "type": "RS",
      "columns": [
        {
          "name": data?.id?.descripton || 'descripton',
          "id": "descripton"
        },
      ],
      "top": 155 * ((data.inputs.length + 1) / 2) - 100,
      "left": 550
    })

    return result
  }

  /**
   * 渲染节点和关系（对应原 DataDraw.draw 方法）
   */
  private drawData(json: { nodes: Node[], relations: Relation[] }): void {
    const $container = $(this.areaId);
    // 清空容器（避免重复渲染）
    $container.find('.pa').remove();

    // 1. 渲染所有节点
    json.nodes.forEach(node => {
      const data = {
        id: node.id,
        name: node.name,
        top: node.top,
        left: node.left,
      };

      // 获取节点模板并渲染
      const template = this.getNodeTemplate(node);
      $container.append(Mustache.render(template, data));

      // 添加节点的列（生成列的 DOM）
      this.addNodeColumns(node);

      // 根据节点类型添加端点
      this.addNodeEndpoints(node);
    });

    // 2. 根据关系连线
    this.connectRelations(json.nodes, json.relations);
  }

  /**
   * 获取节点模板（对应原 DataDraw.getTemplate 方法）
   */
  private getNodeTemplate(node: Node): string {
    const templateMap: Record<string, string> = {
      Origin: ` <div class="pa" id='{{id}}' style='top:{{top}}px;left:{{left}}px'>
        <div class="panel panel-node panel-node-origin" id='{{id}}-inner'>
            <div id='{{id}}-heading' data-id="{{id}}" class="table-header">{{name}}</div>
            <ul id='{{id}}-cols' class="col-group"></ul>
        </div>
    </div>`,
      Middle: `<div class="pa" id='{{id}}' style='top:{{top}}px;left:{{left}}px'>
        <div class="panel panel-node panel-node-middle" id='{{id}}-inner'>
            <div id='{{id}}-heading' data-id="{{id}}" class="table-header" style="background-color: #DFC6A8;color: white">{{name}}</div>
            <ul id='{{id}}-cols' class="col-group"></ul>
        </div>
    </div>`,
      UNION: `<div class="pa" id='{{id}}' style='top:{{top}}px;left:{{left}}px'>
        <div class="panel panel-node panel-node-union" id='{{id}}-inner'>
            <div id='{{id}}-heading' data-id="{{id}}" class="table-header" style="background-color: #66ccff;color: white">{{name}}</div>
            <ul id='{{id}}-cols' class="col-group"></ul>
        </div>
    </div>`,
      RS: `<div class="pa" id='{{id}}' style='top:{{top}}px;left:{{left}}px'>
        <div class="panel panel-node panel-node-rs" id='{{id}}-inner'>
            <div id='{{id}}-heading' data-id="{{id}}" class="table-header" style="background-color: #ff9900;color: white">{{name}}</div>
            <ul id='{{id}}-cols' class="col-group"></ul>
        </div>
    </div>`
    };
    return templateMap[node.type] || '';
  }

  /**
   * 为节点添加列（对应原 draw 方法中列的渲染逻辑）
   */
  private addNodeColumns(node: Node): void {
    node.columns.forEach(col => {
      const ul = $(`#${node.id}-cols`);
      const li = $("<li class='panel-node-list' ></li>");
      // 列的唯一 ID（格式：节点名.列名）
      const colId = `${node.name}.${col.id}`;
      li.attr('id', colId);
      li.text(col.name);

      // 列的鼠标悬停样式
      li.on('mouseover', () => li.css("background-color", "#faebd7"));
      li.on('mouseout', () => li.css("background-color", "#fff"));

      ul.append(li);
    });
  }

  /**
   * 为节点添加端点（对应原 addEndpointOfXXX 方法）
   */
  private addNodeEndpoints(node: Node): void {
    // 先设置节点可拖拽
    this.setNodeDraggable(node.id);

    switch (node.type) {
      case 'Origin':
        this.addOriginEndpoints(node);
        break;
      case 'Middle':
      case 'UNION':
        this.addMiddleUnionEndpoints(node);
        break;
      case 'RS':
        this.addRSEndpoints(node);
        break;
    }
  }

  /**
   * 设置节点可拖拽（对应原 addDraggable 方法）
   */
  private setNodeDraggable(nodeId: string): void {
    this.jsPlumbInstance.draggable(nodeId, {
      containment: this.areaId // 限制在容器内拖拽
    });
  }

  /**
   * 获取基础配置（对应原 getBaseNodeConfig 方法）
   */
  private getBaseConfig(): any {
    return { ...visoConfig.baseStyle };
  }

  /**
   * 为 Origin 节点添加端点
   */
  private addOriginEndpoints(node: Node): void {
    const config = this.getBaseConfig();
    config.isSource = true;
    config.maxConnections = -1; // 不限制连线数

    node.columns.forEach(col => {
      const colId = `${node.id}.${col.id}`;
      this.jsPlumbInstance.addEndpoint(colId, {
        anchors: 'Right', // 锚点在右侧
        uuid: `${colId}-Right` // 端点唯一 ID
      }, config);
    });
  }

  /**
   * 为 Middle/UNION 节点添加端点（左右两侧都有端点）
   */
  private addMiddleUnionEndpoints(node: Node): void {
    const config = this.getBaseConfig();
    config.maxConnections = -1;

    node.columns.forEach(col => {
      const colId = `${node.id}.${col.id}`;
      // 左侧端点（作为目标）
      this.jsPlumbInstance.addEndpoint(colId, {
        anchors: 'Left',
        uuid: `${colId}-Left`
      }, config);
      // 右侧端点（作为来源）
      this.jsPlumbInstance.addEndpoint(colId, {
        anchors: 'Right',
        uuid: `${colId}-Right`
      }, config);
    });
  }

  /**
   * 为 RS 节点添加端点
   */
  private addRSEndpoints(node: Node): void {
    const config = this.getBaseConfig();
    config.isTarget = true;
    config.maxConnections = -1;

    node.columns.forEach(col => {
      const colId = `${node.id}.${col.id}`;
      this.jsPlumbInstance.addEndpoint(colId, {
        anchors: 'Left', // 锚点在左侧
        uuid: `${colId}-Left`
      }, config);
    });
  }

  /**
   * 根据关系连线（对应原 finalConnect 方法）
   */
  private connectRelations(nodes: Node[], relations: Relation[]): void {
    nodes.forEach(node => {
      // 排除 RS 节点的主动连线
      if (node.id !== 'RS' && node.type !== 'RS') {
        node.columns.forEach(col => {
          const currentColId = `${node.name}.${col.id}`;
          relations.forEach(relation => {
            const relationSourceId = `${relation.source.parentName}.${relation.source.column}`;
            // 匹配关系中的来源列，进行连线
            if (relationSourceId === currentColId) {
              const sourceUuid = `${currentColId}-Right`;
              const targetUuid = `${relation.target.parentName}.${relation.target.column}-Left`;
              this.connectEndpoints(sourceUuid, targetUuid);
            }
          });
        });
      }
    });

    // 绑定连线的鼠标悬停高亮事件
    this.bindConnectionHoverEvent(relations);
  }

  /**
   * 连接两个端点（对应原 connectEndpoint 方法）
   */
  private connectEndpoints(fromUuid: string, toUuid: string): void {
    this.jsPlumbInstance.connect({
      uuids: [fromUuid, toUuid],
      connector: ['StateMachine'] // 连线类型
    });
  }

  /**
   * 绑定连线的鼠标悬停/离开事件（高亮相关列和连线）
   */
  private bindConnectionHoverEvent(relations: Relation[]): void {
    // 先解绑旧事件，避免重复绑定
    this.jsPlumbInstance.unbind('mouseover');
    this.jsPlumbInstance.unbind('mouseout');

    // 鼠标悬停：高亮相关列和连线
    this.jsPlumbInstance.bind('mouseover', (conn: any) => {
      const targetIdParts = conn.targetId.split('.');
      if (targetIdParts.length >= 2) {
        const [parentName, column] = targetIdParts;
        const activeNodes = this.findActiveNodes(relations, parentName, column);
        this.highlightActiveElements(activeNodes, true);
      }
    });

    // 鼠标离开：恢复默认样式
    this.jsPlumbInstance.bind('mouseout', (conn: any) => {
      const targetIdParts = conn.targetId.split('.');
      if (targetIdParts.length >= 2) {
        const [parentName, column] = targetIdParts;
        const activeNodes = this.findActiveNodes(relations, parentName, column);
        this.highlightActiveElements(activeNodes, false);
      }
    });
  }

  /**
   * 查找相关节点（上下游）（对应原 findActiveNode 方法）
   */
  private findActiveNodes(relations: Relation[], parentName: string, column: string): RelationSourceTarget[] {
    return this.findChildNodes(relations, parentName, column)
      .concat(this.findParentNodes(relations, parentName, column));
  }

  /**
   * 查找子节点（下游）（对应原 findChildNode 方法）
   */
  private findChildNodes(relations: Relation[], parentName: string, column: string): RelationSourceTarget[] {
    const result: RelationSourceTarget[] = [{ parentName, column }];
    relations.forEach(relation => {
      if (relation.target.parentName === parentName && relation.target.column === column) {
        result.push(...this.findChildNodes(relations, relation.source.parentName, relation.source.column));
      }
    });
    return result;
  }

  /**
   * 查找父节点（上游）（对应原 findParentNode 方法）
   */
  private findParentNodes(relations: Relation[], parentName: string, column: string): RelationSourceTarget[] {
    const result: RelationSourceTarget[] = [{ parentName, column }];
    relations.forEach(relation => {
      if (relation.source.parentName === parentName && relation.source.column === column) {
        result.push(...this.findParentNodes(relations, relation.target.parentName, relation.target.column));
      }
    });
    return result;
  }

  /**
   * 高亮/取消高亮相关元素（列和连线）
   */
  private highlightActiveElements(activeNodes: RelationSourceTarget[], isHighlight: boolean): void {
    activeNodes.forEach(node => {
      const colId = `${node.parentName}.${node.column}`;
      const endpointSelector = { source: colId };

      // 处理连线样式
      this.jsPlumbInstance.selectEndpoints(endpointSelector).each((endpoint: any) => {
        endpoint.connectorStyle.strokeStyle = isHighlight ? 'black' : '#c4c4c4';
        this.jsPlumbInstance.repaint(colId); // 重绘端点
      });

      // 处理列的背景色
      const $colElement = $(`#${node.parentName}-cols`).find(`#${node.parentName}\\.${node.column}`);
      $colElement.css("background-color", isHighlight ? "#faebd7" : "#fff");
    });
  }

  /**
   * 销毁 jsPlumb 实例（组件销毁时调用，避免内存泄漏）
   */
  public destroy(): void {
    if (this.jsPlumbInstance) {
      this.jsPlumbInstance.deleteEveryConnection();
      this.jsPlumbInstance.deleteEveryEndpoint();
      this.jsPlumbInstance = null;
    }
  }
}