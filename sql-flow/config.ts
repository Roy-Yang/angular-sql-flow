// 定义连接线样式类型
interface ConnectorStyle {
    lineWidth: number;
    strokeStyle: string;
    outlineColor?: string;
    outlineWidth?: string | number;
    [key: string]: any;
}

// 定义端点样式类型
interface EndpointStyle {
    radius: number;
    outlineStroke: string;
    outlineWidth: number;
    [key: string]: any;
}

// 定义覆盖物类型
interface Overlay {
    [0]: string;
    [1]: {
        width: number;
        length: number;
        location: number;
        [key: string]: any;
    };
}

// 定义基础样式配置类型
interface BaseStyle {
    endpoint: [string, EndpointStyle];
    connectorStyle: ConnectorStyle;
    connectorHoverStyle: ConnectorStyle;
    paintStyle: {
        lineWidth: number;
        [key: string]: any;
    };
    hoverPaintStyle: {
        stroke: string;
        [key: string]: any;
    };
    isSource: boolean;
    isTarget: boolean;
    connectorOverlays: Overlay[];
    [key: string]: any;
}

// 定义完整的配置对象类型
interface VisoConfig {
    visoTemplate: Record<string, any>;
    connectorPaintStyle: ConnectorStyle;
    connectorHoverStyle: ConnectorStyle;
    baseStyle: BaseStyle;
    baseArchors: string[];
}

// 提取共享样式为独立变量（关键修复）
const baseConnectorStyle: ConnectorStyle = {
    lineWidth: 2,
    strokeStyle: '#c4c4c4',
    outlineColor: '',
    outlineWidth: ''
};

const hoverConnectorStyle: ConnectorStyle = {
    lineWidth: 3,
    strokeStyle: 'black',
    outlineWidth: 10,
    outlineColor: ''
};

// 配置对象实现（无循环引用）
const visoConfig: VisoConfig = {
    visoTemplate: {},

    // 引用独立的样式变量
    connectorPaintStyle: baseConnectorStyle,
    connectorHoverStyle: hoverConnectorStyle,

    baseStyle: {
        endpoint: ['Dot', {
            radius: 2,
            outlineStroke: 'red',
            outlineWidth: 2
        }],
        // 直接使用独立的样式变量，避免循环引用
        connectorStyle: baseConnectorStyle,
        connectorHoverStyle: hoverConnectorStyle,
        paintStyle: {
            lineWidth: 2
        },
        hoverPaintStyle: { stroke: 'blue' },
        isSource: true,
        isTarget: true,
        connectorOverlays: [
            ['Arrow', {
                width: 10,
                length: 13,
                location: 1
            }]
        ]
    },

    baseArchors: ['RightMiddle', 'LeftMiddle']
};

export default visoConfig;
