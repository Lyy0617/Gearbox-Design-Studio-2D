
import React from 'react';
import { ComponentType } from '../types';
import { Settings, Circle, GripVertical, CircleDot, BoxSelect, Hexagon, Spline, Link, Minus, Dot } from 'lucide-react';

const PaletteItem = ({ type, label, icon: Icon }: { type: ComponentType; label: string; icon: any }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center gap-3 p-3 mb-2 bg-white border border-slate-200 rounded-md cursor-grab hover:bg-slate-50 hover:border-blue-500 transition-colors active:cursor-grabbing shadow-sm group"
    >
      <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
        <Icon size={20} />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <GripVertical size={16} className="ml-auto text-slate-300" />
    </div>
  );
};

export const ComponentPalette: React.FC = () => {
  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full select-none">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Settings className="text-blue-600" />
          零件库
        </h2>
        <p className="text-xs text-slate-500 mt-1">拖拽零件到画布上</p>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
        <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">旋转运动</h3>
            <PaletteItem type={ComponentType.SHAFT} label="阶梯轴 (Shaft)" icon={CircleDot} />
            <PaletteItem type={ComponentType.BEARING} label="轴承 (Bearing)" icon={Circle} />
            <PaletteItem type={ComponentType.COUPLING} label="联轴器 (Coupling)" icon={Link} />
        </div>

        <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">传动件</h3>
            <PaletteItem type={ComponentType.GEAR} label="直齿轮 (Spur)" icon={Settings} />
            <PaletteItem type={ComponentType.HELICAL} label="斜齿轮 (Helical)" icon={Spline} />
            <PaletteItem type={ComponentType.BEVEL} label="锥齿轮 (Bevel)" icon={Hexagon} />
            <PaletteItem type={ComponentType.WORM} label="蜗杆 (Worm)" icon={GripVertical} />
        </div>

        <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">附件</h3>
            <PaletteItem type={ComponentType.SPACER} label="套筒/垫片 (Spacer)" icon={Minus} />
            <PaletteItem type={ComponentType.CIRCLIP} label="挡圈 (Circlip)" icon={Dot} />
            <PaletteItem type={ComponentType.HOUSING} label="箱体 (Housing)" icon={BoxSelect} />
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="text-blue-800 text-sm font-bold mb-2">装配提示</h4>
            <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
                <li>轴包含多个轴段</li>
                <li>将零件拖至轴附近可自动吸附</li>
                <li>吸附逻辑已优化，防止误操作</li>
            </ul>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-200 text-center text-xs text-slate-400">
        Gearbox Studio v2.3
      </div>
    </div>
  );
};
