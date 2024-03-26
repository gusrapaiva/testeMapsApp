import React, { useState, useEffect, useRef } from 'react';
import MapView, { LatLng, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import {
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  LocationObject,
  LocationAccuracy,
  watchPositionAsync,
} from 'expo-location';

export default function App() {

  const [location, setLocation] = useState<LocationObject | null>(null);
  const mapRef = useRef<MapView>(null);
  const [results, setResults] = useState<any[]>([]);

  async function requestLocationPermissions(){
    const { granted } = await requestForegroundPermissionsAsync();

    if(granted){
      const currentPosition = await getCurrentPositionAsync();
      setLocation(currentPosition);
      searchPlaces();
    }
  }

  useEffect(() => {
    requestLocationPermissions();
  }, []); 

  useEffect(() => {
    watchPositionAsync({
      accuracy: LocationAccuracy.Highest,
      timeInterval: 1000,
      distanceInterval: 1
    }, (response) => {
      setLocation(response);
      mapRef.current?.animateCamera({
        center: response.coords
      })
    });
  }, []);

  const searchPlaces = async () => {
    const googleApisUrl = "https://maps.googleapis.com/maps/api/place/textsearch/json";
    const input = "Psicologo";
    const locationS = `${location?.coords.latitude}, ${location?.coords.longitude}&radius=2000`;
    const url = `${googleApisUrl}?query=${input}&location=${locationS}&key=APIKEY`;
    try{
      const resp = await fetch(url);
      const json = await resp.json();
      // console.log(json);
      if(json && json.results){
        const coords: LatLng[] = []
        for(const item of json.results) {
          coords.push({
            latitude: item.geometry.location.lat,
            longitude: item.geometry.location.lng,
          })
        }
        setResults(json.results)
        if(coords.length){
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: {
              top: 10,
              right: 10,
              bottom: 10,
              left: 10
            },
            animated: true
          })
        }
      }
    }
    catch(e){
      console.error(e)
    }
  }

  return (
    <View style={styles.container}>
      {
        location && 
        <MapView style={styles.map} 
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005
          }}
          ref={mapRef}
        >
          <Marker 
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
          />

          {results.length ? results.map((item, i) => {
            const coord: LatLng = {
              latitude: item.geometry.location.lat,
              longitude: item.geometry.location.lng,
            }
            return <Marker key={`search-item-${i}`} coordinate={coord} title={item.name} description="" />
          }): null}
        </MapView>
      }
    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
