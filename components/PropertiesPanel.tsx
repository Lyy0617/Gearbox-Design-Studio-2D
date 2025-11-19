
import React from 'react';
import { GearboxItem, ComponentType, GearComponent, ShaftComponent, BearingComponent, WormComponent, HousingComponent, SimplePartComponent, BearingType } from '../types';
import { Trash2, X, Info, Plus, Minus, RotateCw } from 'lucide-react';

interface Props {
  item: GearboxItem | null;
  onUpdate: (id: string, updates: Partial<GearboxItem>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<Props> = ({ item, onUpdate, onDelete, onClose }) => {
  if (!item) {
    return (
      <div className="w-72 bg-slate-50 border-l border-slate-200 p-6 text-center text-slate-400 hidden lg:flex flex-col justify-center items-center h-full">
        <div className="bg-white border border-slate-200 p-4 rounded-full mb-4 shadow-sm">
            <Info size={32} className="opacity-50 text-blue-500" />
        </div>
        <p>在画布上选择一个组件以查看属性</p>
      </div>
    );
  }

  const renderRotationControl = () => (
    <div className="mb-4">
        <label className="block text-xs text-slate-500 mb-1">旋转角度 (装配方向)</label>
        <div className="flex gap-2">
            {[0, 90, 180, 270].map(deg => (
                <button
                    key={deg}
                    onClick={() => onUpdate(item.id, { rotation: deg })}
                    className={`flex-1 py-1 text-xs border rounded ${
                        item.rotation === deg 
                        ? 'bg-blue-100 border-blue-500 text-blue-700 font-bold' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    {deg}°
                </button>
            ))}
        </div>
    </div>
  );

  const renderGearProps = (gear: GearComponent) => (
    <>
      {gear.type === ComponentType.BEVEL && renderRotationControl()}
      
      <div className="mb-4">
        <label className="block text-xs text-slate-500 mb-1">齿数 (Teeth)</label>
        <input
          type="number"
          min="6"
          max="200"
          value={gear.params.teeth}
          onChange={(e) => onUpdate(gear.id, { params: { ...gear.params, teeth: Number(e.target.value) } })}
          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs text-slate-500 mb-1">模数 (Module)</label>
        <input
          type="number"
          step="0.5"
          min="1"
          value={gear.params.module}
          onChange={(e) => onUpdate(gear.id, { params: { ...gear.params, module: Number(e.target.value) } })}
          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs text-slate-500 mb-1">齿宽 (Thickness)</label>
        <input
          type="number"
          min="1"
          value={gear.params.thickness}
          onChange={(e) => onUpdate(gear.id, { params: { ...gear.params, thickness: Number(e.target.value) } })}
          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        />
      </div>
      {gear.type === ComponentType.HELICAL && (
          <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">螺旋角 (Helix Angle)</label>
            <input
              type="number"
              min="0"
              max="45"
              value={gear.params.helixAngle || 20}
              onChange={(e) => onUpdate(gear.id, { params: { ...gear.params, helixAngle: Number(e.target.value) } })}
              className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>
      )}
      <div className="p-3 bg-slate-100 rounded mb-4 border border-slate-200">
          <div className="text-xs text-slate-500 uppercase mb-1">尺寸计算</div>
          <div className="flex justify-between text-sm">
              <span className="text-slate-500">分度圆直径:</span>
              <span className="text-slate-800 font-mono">{(gear.params.teeth * gear.params.module).toFixed(1)}mm</span>
          </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs text-slate-500 mb-1">颜色</label>
        <input
            type="color"
            value={gear.params.color}
            onChange={(e) => onUpdate(gear.id, { params: { ...gear.params, color: e.target.value } })}
            className="w-full h-8 rounded cursor-pointer border border-slate-200 p-0.5 bg-white"
        />
      </div>
    </>
  );

  const renderShaftProps = (shaft: ShaftComponent) => (
    <>
      <div className="mb-2 flex justify-between items-center">
         <label className="text-xs text-slate-500">轴段配置 (Segments)</label>
         <button 
            onClick={() => {
                const newSeg = { id: Math.random().toString(36), length: 50, diameter: 20 };
                onUpdate(shaft.id, { params: { ...shaft.params, segments: [...shaft.params.segments, newSeg] } });
            }}
            className="text-blue-600 hover:text-blue-500 text-xs flex items-center gap-1"
         >
             <Plus size={12} /> 添加
         </button>
      </div>
      
      <div className="space-y-2 mb-4">
          {shaft.params.segments.map((seg, idx) => (
              <div key={seg.id} className="bg-white p-2 rounded border border-slate-200 flex items-center gap-2 shadow-sm">
                  <span className="text-xs text-slate-400 w-4 font-mono">{idx+1}</span>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                          <label className="text-[10px] text-slate-400 block">长度</label>
                          <input 
                             type="number" 
                             value={seg.length}
                             onChange={(e) => {
                                 const newSegs = [...shaft.params.segments];
                                 newSegs[idx] = { ...seg, length: Number(e.target.value) };
                                 onUpdate(shaft.id, { params: { ...shaft.params, segments: newSegs } });
                             }}
                             className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-800"
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-400 block">直径</label>
                          <input 
                             type="number" 
                             value={seg.diameter}
                             onChange={(e) => {
                                 const newSegs = [...shaft.params.segments];
                                 newSegs[idx] = { ...seg, diameter: Number(e.target.value) };
                                 onUpdate(shaft.id, { params: { ...shaft.params, segments: newSegs } });
                             }}
                             className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-800"
                          />
                      </div>
                  </div>
                  <button 
                     onClick={() => {
                         if (shaft.params.segments.length > 1) {
                            const newSegs = shaft.params.segments.filter((_, i) => i !== idx);
                            onUpdate(shaft.id, { params: { ...shaft.params, segments: newSegs } });
                         }
                     }}
                     className="text-slate-400 hover:text-red-500"
                  >
                      <Minus size={14} />
                  </button>
              </div>
          ))}
      </div>
      
      <div className="p-3 bg-slate-100 rounded mb-4 border border-slate-200">
          <div className="flex justify-between text-sm">
              <span className="text-slate-500">总长度:</span>
              <span className="text-slate-800 font-mono">{shaft.params.segments.reduce((a,b) => a + b.length, 0)}mm</span>
          </div>
      </div>
    </>
  );

  const renderBearingProps = (bearing: BearingComponent) => (
      <>
        <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">类型</label>
            <select
                value={bearing.params.subtype || BearingType.DEEP_GROOVE}
                onChange={(e) => onUpdate(bearing.id, { params: { ...bearing.params, subtype: e.target.value as BearingType } })}
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            >
                <option value={BearingType.DEEP_GROOVE}>深沟球轴承 (Deep Groove)</option>
                <option value={BearingType.ANGULAR_CONTACT}>角接触球轴承 (Angular Contact)</option>
                <option value={BearingType.CYLINDRICAL_ROLLER}>圆柱滚子轴承 (Cylindrical Roller)</option>
                <option value={BearingType.TAPERED_ROLLER}>圆锥滚子轴承 (Tapered Roller)</option>
                <option value={BearingType.SELF_ALIGNING}>调心轴承 (Self-aligning)</option>
                <option value={BearingType.THRUST}>推力轴承 (Thrust)</option>
            </select>
        </div>
        <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">宽度 (mm)</label>
            <input
            type="number"
            min="1"
            value={bearing.params.width}
            onChange={(e) => onUpdate(bearing.id, { params: { ...bearing.params, width: Number(e.target.value) } })}
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
        </div>
        <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">外径 (mm)</label>
            <input
            type="number"
            min="10"
            value={bearing.params.outerDiameter}
            onChange={(e) => onUpdate(bearing.id, { params: { ...bearing.params, outerDiameter: Number(e.target.value) } })}
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
        </div>
      </>
  );

  const renderSimplePartProps = (part: SimplePartComponent) => (
      <>
        <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">宽度 / 长度</label>
            <input
            type="number"
            value={part.params.width}
            onChange={(e) => onUpdate(part.id, { params: { ...part.params, width: Number(e.target.value) } })}
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
        </div>
        <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">外径</label>
            <input
            type="number"
            value={part.params.outerDiameter}
            onChange={(e) => onUpdate(part.id, { params: { ...part.params, outerDiameter: Number(e.target.value) } })}
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
        </div>
      </>
  )

  const renderWormProps = (worm: WormComponent) => (
      <>
      <div className="mb-4">
        <label className="block text-xs text-slate-500 mb-1">长度 (mm)</label>
        <input
          type="number"
          min="10"
          value={worm.params.length}
          onChange={(e) => onUpdate(worm.id, { params: { ...worm.params, length: Number(e.target.value) } })}
          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div className="mb-4">
        <label className="block text-xs text-slate-500 mb-1">直径 (mm)</label>
        <input
          type="number"
          min="5"
          value={worm.params.diameter}
          onChange={(e) => onUpdate(worm.id, { params: { ...worm.params, diameter: Number(e.target.value) } })}
          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        />
      </div>
      </>
  );

  const renderHousingProps = (housing: HousingComponent) => (
      <>
        <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">宽度</label>
            <input
            type="number"
            value={housing.params.width}
            onChange={(e) => onUpdate(housing.id, { params: { ...housing.params, width: Number(e.target.value) } })}
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
        </div>
        <div className="mb-4">
            <label className="block text-xs text-slate-500 mb-1">高度</label>
            <input
            type="number"
            value={housing.params.height}
            onChange={(e) => onUpdate(housing.id, { params: { ...housing.params, height: Number(e.target.value) } })}
            className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
            />
        </div>
      </>
  );

  return (
    <div className="absolute top-4 right-4 bottom-4 w-80 bg-white/95 backdrop-blur border border-slate-200 shadow-2xl rounded-xl flex flex-col z-10">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <div>
            <h2 className="font-bold text-slate-800 capitalize">
                {/* Simple translation map for headers */}
                {item.type === ComponentType.SHAFT ? '轴属性' : 
                 item.type === ComponentType.GEAR ? '直齿轮属性' : 
                 item.type === ComponentType.BEARING ? '轴承属性' : 
                 item.type === ComponentType.HELICAL ? '斜齿轮属性' : 
                 item.type === ComponentType.HOUSING ? '箱体属性' : 
                 item.type === ComponentType.BEVEL ? '锥齿轮属性' : '组件属性'}
            </h2>
            <div className="text-xs font-mono text-slate-400 mt-0.5">ID: {item.id.slice(0, 8)}</div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-6">
            <h3 className="text-xs font-bold text-blue-600 uppercase mb-3">位置坐标</h3>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-slate-500 mb-1">轴向 (X)</label>
                    <input
                    type="number"
                    value={Math.round(item.x)}
                    onChange={(e) => onUpdate(item.id, { x: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-800"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-500 mb-1">径向 (Y)</label>
                    <input
                    type="number"
                    value={Math.round(item.y)}
                    onChange={(e) => onUpdate(item.id, { y: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-800"
                    />
                </div>
            </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold text-blue-600 uppercase mb-3">详细参数</h3>
            {(item.type === ComponentType.GEAR || item.type === ComponentType.HELICAL || item.type === ComponentType.BEVEL) && renderGearProps(item as GearComponent)}
            {item.type === ComponentType.SHAFT && renderShaftProps(item as ShaftComponent)}
            {item.type === ComponentType.BEARING && renderBearingProps(item as BearingComponent)}
            {item.type === ComponentType.WORM && renderWormProps(item as WormComponent)}
            {item.type === ComponentType.HOUSING && renderHousingProps(item as HousingComponent)}
            {(item.type === ComponentType.COUPLING || item.type === ComponentType.SPACER || item.type === ComponentType.CIRCLIP) && renderSimplePartProps(item as SimplePartComponent)}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <button
          onClick={() => onDelete(item.id)}
          className="flex items-center justify-center gap-2 w-full py-2 bg-red-50 border border-red-200 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all text-sm font-medium"
        >
          <Trash2 size={16} />
          删除组件
        </button>
      </div>
    </div>
  );
};
