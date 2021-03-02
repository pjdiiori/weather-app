import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
const axios = require('axios');
const usCities = require('./cities/usCities.json');


function Button(props){
    return (
        <button onClick={props.onClick} className="btn btn-lg btn-outline-secondary" type="button" id="button-addon2">
            weather me
        </button>
    )
}

function LocationInput(props){
    return (
        <input onKeyDown={props.onKeyDown} onInput={props.onInput} type="text" className="form-control" placeholder="Where are you located?"/>
    )
}

function findCity(input){
    let cityObj;
    if(input.toLowerCase() === 'dc'){
        usCities.forEach(city => {
            if(city.state === 'DC'){
                cityObj = city;
            }
        })
    } else if(input.includes(',')){
        usCities.forEach(city => {
            let match = `${city.name.toLowerCase()},${city.state.toLowerCase()}`
            if(input.replace(', ',',').toLowerCase() === match){
                cityObj = city;
            }
        })
    } else {
        usCities.forEach(city => {
            if(input.toLowerCase() === city.name.toLowerCase()){
                cityObj = city;
            }
        })
    }
    return cityObj ? cityObj : false
}


async function fetchForecast(city){
    try {
        const APIkey = ***REMOVED***;
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?id=${city.id}&units=imperial&appid=${APIkey}`)
        
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
            console.log(error.request.response);
        } else if (error.response) {
            console.log(error.response);
        } else {
            console.log(error);
        }
    }
}


class WeatherApp extends React.Component {
    state = {
        display: false,
        isLoaded: false,
        foundCity: true,
    }

    displayToggle = async () => {
        const foundCity = findCity(this.state.searchedFor);
        if(foundCity) {
            let forecast = await fetchForecast(foundCity)
            this.setState({
                foundCity: foundCity,
                display: true,
                weatherData: forecast,
                isLoaded: true,
            });
        } else this.setState({foundCity: false});
    }

    locationHandler = (input) => this.setState({searchedFor: input.target.value})

    pressedEnter = (event) => event.key === "Enter" ? this.displayToggle() : null

    render(){
        return (
            <div>
                <div className="input-group input-group-lg">
                    <LocationInput onInput={this.locationHandler} onKeyDown={this.pressedEnter} />
                    <div className="input-group-append">
                        <Button onClick={this.displayToggle} />
                    </div>
                </div>
                <WeatherDisplay displayState={this.state} weatherData={this.state.weatherData} />
            </div>
        )
    }
}

class WeatherDisplay extends React.Component {
    render(){
        const {weatherData} = this.props
        const {display, isLoaded, foundCity} = this.props.displayState
        
        if(!foundCity){
            return (
                <div className={"alert alert-danger"}>
                    <i className="text-muted">Sorry, couldn't find that location</i>
                </div>
            )
        } else {
            if(isLoaded){
                return <FormattedDisplay foundCity={foundCity} weatherData={weatherData} />
            } else if(display){
                return <p>Loading...</p>
            } else return null;
        }
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

class FormattedDisplay extends React.Component {
    state = {
        unit: 'F',
    }
    
    toggleUnit = (unit) => this.setState({unit})
    muted = (unit) => this.state.unit !== unit ? 'text-muted' : '';
    celsius = (temp) => Math.round((temp - 32) * 5/9);
    temp = (temp) => this.state.unit === 'F' ? temp.toFixed() : this.celsius(temp).toFixed()
    
    get icon() {
        const { icon } = this.props.weatherData.weather[0]
        return `http://openweathermap.org/img/wn/${icon}@4x.png`
    }
    
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
        const compass = ["north","northeast","east","southeast","south","southwest","west","northwest","north"]
        
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
                    <div className="col">
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
