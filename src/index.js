import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Typeahead } from 'react-bootstrap-typeahead';
import axios from 'axios';
import usCities from './cities/usCities.json';

function Button(props){
    return (
        <button
            onClick={props.onClick}
            className="btn btn-lg btn-outline-secondary"
            type="button"
            id="button-addon2"
        >
            weather me
        </button>
    )
}

function findCity(input){
    let cityObj;
    usCities.forEach(city => {
        if(input === city.id){
            cityObj = city;
        }
    })
    return cityObj ? cityObj : false
}


async function fetchForecast(cityID){
    try {
        const APIkey = ***REMOVED***;
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?id=${cityID}&units=imperial&appid=${APIkey}`)
        
        const sunRiseSet = (time) => {
            const shift = response.data.timezone === -21600 ? 0 : response.data.timezone - -21600;
            return new Date((time + shift) * 1000).toLocaleTimeString().slice(0,4)
        }

        let { deg, speed } = response.data.wind
        let { sunrise, sunset } = response.data.sys

        response.data.wind.deg = Math.round(deg/45)
        response.data.wind.speed = Math.round(speed)
        response.data.sys.sunrise = sunRiseSet(sunrise)+'AM'
        response.data.sys.sunset = sunRiseSet(sunset)+'PM'

        return response.data

    } catch (error) {
        if (error.request) {
            return 'error'
        } else if (error.response) {
            return 'error'
        } else {
            return 'error'
        }
    }
}


class WeatherApp extends React.Component {
    constructor(props){
        super(props);
        this.input = React.createRef();
    }
    state = {
        foundCity: false,
        isLoaded: false,
    }

    displayToggle = async () => {
        const forecast = await fetchForecast(this.state.searchedFor)
        this.setState({
            isLoaded: true,
            foundCity: findCity(this.state.searchedFor),
            weatherData: forecast,
        })
    }

    locationHandler = (input) => {
        if(input.length !== 0){
            this.setState({searchedFor: input[0].id})
        }
    };

    get cities(){
        return usCities.map((city) => {return {id: city.id, label: `${city.name}, ${city.state}`}})
    }

    render(){
        return (
            <div>
                <div className="input-group input-group-lg flex-nowrap">
                    <Typeahead
                        autoFocus={true}
                        align='left'
                        id="citySearch"
                        onChange={this.locationHandler}
                        placeholder="eg: New Orleans, LA"
                        options={this.cities}
                        minLength={1}
                    />
                    <div className="input-group-append">
                        <Button onClick={this.displayToggle} />
                    </div>
                </div>
                <WeatherDisplay data={this.state} />
            </div>
        )
    }
}

class WeatherDisplay extends React.Component {
    render(){
        const {foundCity, weatherData, isLoaded} = this.props.data;
        
        if(weatherData === 'error'){
            return <div className="alert alert-danger"><i>Sorry, couldn't find that city</i></div>
        }
        if(foundCity){
            if(!isLoaded) {
                return <div className="text-muted"><i>Loading...</i></div>
            } else return <FormattedDisplay foundCity={foundCity} weatherData={weatherData} />
        } else return null;
    }
}

const colors = {
    "Clear":'info',
    "Clouds":'secondary',
    "Mist":'secondary',
    "Smoke":'secondary',
    "Haze":'secondary',
    "Fog":'secondary',
    "Tornado":'secondary',
    "Dust":'warning',
    "Sand":'warning',
    "Ash":'dark',
    "Snow":'light',
    "Thunderstorm":'dark',
    "Rain":'primary',
    "Drizzle":'primary',
    "Squall":'primary',
}
const compass = ["north","northeast","east","southeast","south","southwest","west","northwest","north"]

class FormattedDisplay extends React.Component {
    state = {
        unit: 'F',
    }
    
    toggleUnit = (unit) => this.setState({unit})
    muted = (unit) => this.state.unit !== unit ? 'text-muted' : '';
    celsius = (temp) => Math.round((temp - 32) * 5/9);
    temp = (temp) => this.state.unit === 'F' ? temp.toFixed() : this.celsius(temp).toFixed()
    
    get icon() {return `http://openweathermap.org/img/wn/${this.props.weatherData.weather[0].icon}@4x.png`}
    
    get bgColor() {
        const { description, main } = this.props.weatherData.weather[0]
        return description === "few clouds" ? "info" : colors[main]
    }
    
    render(){
        const {state} = this.props.foundCity
        const { weatherData } = this.props
        const {feels_like, humidity, temp} = weatherData.main
        const { description } = this.props.weatherData.weather[0];
        const {sunrise, sunset} = weatherData.sys;
        const {deg, speed} = weatherData.wind;
        
        return (
            <div id="weatherAlert" className={`alert alert-${this.bgColor}`} role="alert">
                <div className="row">
                    <div className="col">
                        <h1  id="temp">
                            {this.temp(temp)}
                            <div className="btn-group" role="group">
                                <button
                                    onClick={() => this.toggleUnit('F')}
                                    type="button" 
                                    className={`btn ${this.muted('F')}`} 
                                    >°F
                                </button>
                                <span>|</span>
                                <button
                                    onClick={() => this.toggleUnit('C')}
                                    type="button"
                                    className={`btn ${this.muted('C')}`}
                                    >°C
                                </button>
                            </div>
                        </h1>
                        <p>
                            Feels like {this.temp(feels_like)}°,
                            with {description.includes('clear')?'clear skies':description}
                        </p>
                        <div id="deets" className="alert alert-light">
                            <label className="alert alert-light">Details: </label>
                            <ul>
                                <li>Humidity: {humidity}%</li>
                                <li>Sunrise: {sunrise}</li>
                                <li>Sunset: {sunset}</li>
                                <li>Wind blowing {compass[deg]} at {speed}mph</li>
                            </ul>
                        </div>
                        <i className="text-muted">{weatherData.name}{state === 'DC' ? '' : ', '+state}</i>
                    </div>
                    <div className="col" id="img-col">
                        <img src={this.icon}></img>
                    </div>
                </div>
            </div>
        )
    }
}


ReactDOM.render(
    <WeatherApp />,
    document.getElementById('root')
);
