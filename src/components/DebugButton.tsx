import OBR from '@owlbear-rodeo/sdk';

export function DebugButton() {
  const handleDebug = async () => {
    try {
      const items = await OBR.scene.items.getItems();
      const selected = await OBR.player.getSelection();
      
      if (!selected || selected.length === 0) {
        alert('Сначала выдели токен на карте!');
        return;
      }
      
      const tokenId = selected[0];
      const token = items.find(i => i.id === tokenId);
      const attachments = items.filter(i => i.attachedTo === tokenId);
      
      console.log('=== ТОКЕН ===');
      console.log(JSON.stringify(token, null, 2));
      console.log('=== ATTACHMENTS (' + attachments.length + ') ===');
      attachments.forEach((a, i) => {
        console.log('--- #' + (i+1) + ' ---');
        console.log(JSON.stringify(a, null, 2));
      });
      
      alert('Данные в консоли (F12). Найдено ' + attachments.length + ' attachments.');
      
    } catch (error) {
      console.error('Debug error:', error);
      alert('Ошибка: ' + error);
    }
  };
  
  return (
    <button 
      onClick={handleDebug}
      style={{
        padding: '8px 16px',
        marginTop: '10px',
        background: '#333',
        color: '#fff',
        border: '1px solid #555',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '100%'
      }}
    >
      🔧 Debug Token
    </button>
  );
}
