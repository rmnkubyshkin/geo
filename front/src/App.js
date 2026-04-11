import './App.css';
import MapContainer from './map/utils/MapContainer';


export const App = () => {
    return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <MapContainer />
            </div>
    );
};

export default App;