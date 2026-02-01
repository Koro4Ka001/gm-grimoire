import { useState } from 'react';
import { useIsGM } from './hooks/useIsGM';
import { useOBR } from './hooks/useOBR';
import { SelectionPanel } from './components/SelectionPanel';
import { MassCalculator } from './components/MassCalculator';
import { CombatLog } from './components/CombatLog';
import { DebugPanel } from './components/DebugPanel';
import { DebugButton } from './components/DebugButton';
import './index.css';

function App() {
  const isGM = useIsGM();
  const { selectedUnits, isReady, isLoading } = useOBR();
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Загрузка роли
  if (isGM === null) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Не ГМ — показываем заглушку
  if (!isGM) {
    return (
      <div className="not-gm-screen">
        <div className="not-gm-content">
          <div className="not-gm-icon">⚔️</div>
          <h2>GM Grimoire</h2>
          <p>Это расширение доступно только для Game Master.</p>
          <p className="not-gm-hint">Если вы ГМ, убедитесь что у вас правильная роль в настройках комнаты.</p>
        </div>
      </div>
    );
  }

  // OBR не готов
  if (!isReady) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Подключение к Owlbear Rodeo...</p>
        </div>
      </div>
    );
  }

  const unitsWithData = selectedUnits.filter(u => u.hasGrimoireData);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>⚔️ GM Grimoire</h1>
        <button 
          className="debug-toggle"
          onClick={() => setShowDebug(!showDebug)}
          title="Debug Panel"
        >
          🔧
        </button>
      </header>

      {/* Debug Panel */}
      {showDebug && <DebugPanel />}

      {/* Main Content */}
      <main className="app-main">
        {isLoading ? (
          <div className="loading-inline">
            <p>Загрузка токенов...</p>
          </div>
        ) : selectedUnits.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <p>Выделите токены на карте</p>
            <p className="empty-hint">Используйте Shift для множественного выбора</p>
          </div>
        ) : (
          <>
            {/* Selected Units */}
            <SelectionPanel 
              combinedUnits={selectedUnits} 
              onOpenCalculator={() => setShowCalculator(true)}
            />

            {/* Attack Button */}
            {unitsWithData.length > 0 && (
              <div className="attack-section">
                <button 
                  className="attack-button"
                  onClick={() => setShowCalculator(true)}
                >
                  ⚔️ Нанести урон ({unitsWithData.length})
                </button>
              </div>
            )}
          </>
        )}

        {/* Combat Log */}
        <CombatLog />

        {/* Debug Button */}
        <div style={{ padding: '0 12px 12px' }}>
          <DebugButton />
        </div>
      </main>

      {/* Damage Calculator Modal */}
      {showCalculator && (
        <MassCalculator 
          combinedUnits={unitsWithData}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}

export default App;
