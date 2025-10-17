import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, Input } from '@angular/core';
declare const $: any
import { DataLineageService } from '../init'

@Component({
  selector: 'app-data-lineage',
  templateUrl: './index.html',
  styleUrls: ['./index.scss'],
  providers: [DataLineageService]
})
export class DataLineageComponent implements OnInit, AfterViewInit {
  @ViewChild('bg', { static: false }) bgElement: ElementRef;
  @Input() field: any;

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialLeft = 0;
  private initialTop = 0;
  private baseZoom = 1;
  private jsPlumbInstance: any;
  private htmlElement: any;
  private pageContainer: any;
  constructor(private readonly dataLineageService: DataLineageService) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.pageContainer = document.getElementById('bg');
    this.htmlElement = document.documentElement;

    // 初始化jsPlumb
    this.jsPlumbInstance = this.dataLineageService.initDataLineage(this.field.id, true)
  }

  // 鼠标事件处理
  onMouseDown(event: MouseEvent): void {
    if (event.button === 2) { // 右键
      // 阻止事件冒泡，避免与其他元素冲突
      event.preventDefault();
      $("#bg").css("cursor", "Grabbing");
      // 标记开始拖拽
      this.isDragging = true;

      // 添加拖拽状态类，用于样式变化
      this.pageContainer.classList.add('dragging');

      // 记录鼠标初始位置
      this.startX = event.clientX;
      this.startY = event.clientY;

      // 记录页面容器当前位置（转换为数字）
      const computedStyle = window.getComputedStyle(this.pageContainer);
      this.initialLeft = parseInt(computedStyle.left, 10);
      this.initialTop = parseInt(computedStyle.top, 10);

      // 更改鼠标样式
      this.htmlElement.style.cursor = 'grabbing';

    }

  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    // 计算鼠标移动的距离
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    // 计算新位置
    const newLeft = this.initialLeft + deltaX;
    const newTop = this.initialTop + deltaY;

    // 应用新位置
    this.pageContainer.style.left = `${newLeft}px`;
    this.pageContainer.style.top = `${newTop}px`;
  }

  onMouseUp(event: MouseEvent): void {
    if (event.button == 2) {
      if (!this.isDragging) return;
      $("#bg").css("cursor", "Auto");
      // 标记结束拖拽
      this.isDragging = false;

      // 移除拖拽状态类
      this.pageContainer.classList.remove('dragging');

      // 恢复鼠标样式
      this.htmlElement.style.cursor = '';

      // 保存当前位置到本地存储（可选功能）
      localStorage.setItem('pageLeft', this.pageContainer.style.left);
      localStorage.setItem('pageTop', this.pageContainer.style.top);
    }
  }

  onMouseLeave(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      $("#bg").css("cursor", "Auto");
      this.pageContainer.classList.remove('dragging');
      this.htmlElement.style.cursor = '';
      localStorage.setItem('pageLeft', this.pageContainer.style.left);
      localStorage.setItem('pageTop', this.pageContainer.style.top);
    }
  }

  // 缩放功能
  resetZoom(): void {
    if (this.baseZoom !== 1) {
      this.baseZoom = 1;
      this.applyZoom();
    }
  }

  zoomIn(): void {
    if(this.baseZoom > 2) {
      return
    }
    this.baseZoom += 0.1;
    this.applyZoom();
  }

  zoomOut(): void {
    if(this.baseZoom <= 0.1) {
      return
    }
    this.baseZoom -= 0.1;
    if (this.baseZoom < 0.1) this.baseZoom = 0.1;
    this.applyZoom();
  }

  private applyZoom(): void {
    $(this.bgElement.nativeElement).css({
      "-webkit-transform": `scale(${this.baseZoom})`,
      "-moz-transform": `scale(${this.baseZoom})`,
      "-ms-transform": `scale(${this.baseZoom})`,
      "-o-transform": `scale(${this.baseZoom})`,
      "transform": `scale(${this.baseZoom})`,
      "transform-origin": "0% 0%"
    });
    this.jsPlumbInstance.setZoom(this.baseZoom);
  }

  // 阻止右键菜单默认行为
  onContextMenu(event: Event): boolean {
    event.preventDefault();
    return false;
  }
}
