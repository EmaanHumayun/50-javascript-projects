
const $ = id => document.getElementById(id);

const searchForm = $("searchForm");
const cityInput = $("cityInput");
const searchBtn = $("searchBtn");
const searchBtnText = $("searchBtnText");
const statusMessage = $("statusMessage");
const forecastList = $("forecastList");

let temperatureChart = null;
let activeRequest = 0;

const weatherCodes = {
    0: ["Clear sky", "☀️", "🌙"],
    1: ["Mainly clear", "🌤️", "🌙"],
    2: ["Partly cloudy", "⛅", "☁️"],
    3: ["Overcast", "☁️", "☁️"],
    45: ["Foggy", "🌫️", "🌫️"],
    48: ["Rime fog", "🌫️", "🌫️"],
    51: ["Light drizzle", "🌦️", "🌧️"],
    53: ["Drizzle", "🌦️", "🌧️"],
    55: ["Heavy drizzle", "🌧️", "🌧️"],
    56: ["Freezing drizzle", "🌧️", "🌧️"],
    57: ["Heavy freezing drizzle", "🌧️", "🌧️"],
    61: ["Light rain", "🌦️", "🌧️"],
    63: ["Moderate rain", "🌧️", "🌧️"],
    65: ["Heavy rain", "🌧️", "🌧️"],
    66: ["Freezing rain", "🌧️", "🌧️"],
    67: ["Heavy freezing rain", "🌧️", "🌧️"],
    71: ["Light snow", "🌨️", "🌨️"],
    73: ["Moderate snow", "🌨️", "🌨️"],
    75: ["Heavy snow", "❄️", "❄️"],
    77: ["Snow grains", "🌨️", "🌨️"],
    80: ["Rain showers", "🌦️", "🌧️"],
    81: ["Moderate showers", "🌧️", "🌧️"],
    82: ["Heavy showers", "⛈️", "⛈️"],
    85: ["Snow showers", "🌨️", "🌨️"],
    86: ["Heavy snow showers", "❄️", "❄️"],
    95: ["Thunderstorm", "⛈️", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️", "⛈️"],
    99: ["Severe thunderstorm", "⛈️", "⛈️"]
};

function weatherInfo(code, isDay = 1) {
    const info = weatherCodes[code] || ["Unknown conditions", "🌡️", "🌡️"];
    return {
        description: info[0],
        icon: isDay ? info[1] : info[2]
    };
}

function showStatus(message, error = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("text-rose-400", error);
    statusMessage.classList.toggle("text-slate-400", !error);
}

function formatTime(value) {
    if (!value) return "--:--";
    const time = value.split("T")[1];
    if (!time) return value;
    const [hours, minutes] = time.split(":");
    const h = Number(hours);
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
}

function formatDate(dateString, options = { weekday: "short", month: "short", day: "numeric" }) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", options);
}

function getUvLabel(value) {
    if (value <= 2) return "Low UV";
    if (value <= 5) return "Moderate UV";
    if (value <= 7) return "High UV";
    if (value <= 10) return "Very high UV";
    return "Extreme UV";
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Weather service is unavailable. Please try again.");
    }
    return response.json();
}

async function searchCity(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;
    const data = await fetchJson(url);

    if (!data.results?.length) {
        throw new Error("City not found. Try another spelling or city name.");
    }

    return data.results.find(
        item => item.name.toLowerCase() === city.trim().toLowerCase()
    ) || data.results[0];
}

async function loadWeather(city) {
    const requestId = ++activeRequest;
    searchBtn.disabled = true;
    searchBtnText.textContent = "Loading";
    showStatus("Fetching the latest forecast...");

    try {
        const place = await searchCity(city);

        const params = new URLSearchParams({
            latitude: place.latitude,
            longitude: place.longitude,
            timezone: "auto",
            forecast_days: "6",
            current: [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "is_day",
                "precipitation",
                "weather_code",
                "wind_speed_10m"
            ].join(","),
            hourly: [
                "temperature_2m",
                "precipitation_probability",
                "weather_code"
            ].join(","),
            daily: [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "sunrise",
                "sunset",
                "uv_index_max"
            ].join(",")
        });

        const weather = await fetchJson(
            `https://api.open-meteo.com/v1/forecast?${params}`
        );

        // Ignore an older response if the user searches again quickly.
        if (requestId !== activeRequest) return;

        if (!weather.current || !weather.daily || !weather.hourly) {
            throw new Error("The weather service returned incomplete data.");
        }

        renderWeather(place, weather);
        showStatus(`Updated weather for ${place.name}.`);
    } catch (error) {
        if (requestId !== activeRequest) return;

        showStatus(
            error instanceof TypeError
                ? "Network error. Check your internet connection."
                : error.message || "Something went wrong.",
            true
        );
    } finally {
        if (requestId === activeRequest) {
            searchBtn.disabled = false;
            searchBtnText.textContent = "Search";
        }
    }
}

function renderWeather(place, weather) {
    const current = weather.current;
    const hourly = weather.hourly;
    const daily = weather.daily;

    $("cityName").textContent = place.name;
    $("countryName").textContent = [
        place.admin1,
        place.country
    ].filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index).join(", ");

    $("temperature").textContent = Math.round(current.temperature_2m);
    $("feelsLike").textContent = `Feels like ${Math.round(current.apparent_temperature)}°C`;
    $("humidity").textContent = current.relative_humidity_2m;
    $("windSpeed").textContent = Math.round(current.wind_speed_10m);

    const currentInfo = weatherInfo(current.weather_code, current.is_day);
    $("mainWeatherIcon").textContent = currentInfo.icon;
    $("mainWeatherIcon").setAttribute("aria-label", currentInfo.description);
    $("weatherDescription").textContent = currentInfo.description;

    const todayHigh = daily.temperature_2m_max[0];
    const todayLow = daily.temperature_2m_min[0];
    $("todayHigh").textContent = `${Math.round(todayHigh)}°`;
    $("todayLow").textContent = `${Math.round(todayLow)}°`;

    const uv = daily.uv_index_max[0];
    $("uvIndex").textContent = Number.isFinite(uv) ? Math.round(uv * 10) / 10 : "--";
    $("uvLabel").textContent = Number.isFinite(uv) ? getUvLabel(uv) : "UV unavailable";

    renderHourly(weather);
    renderDaylight(weather);
    renderDaily(weather);

    const now = new Date(current.time);
    $("localTime").textContent = `Local time · ${formatTime(current.time)}`;

    if (window.lucide) {
        lucide.createIcons();
    }
}

function renderHourly(weather) {
    const hourly = weather.hourly;
    const currentTime = weather.current.time;
    let startIndex = hourly.time.findIndex(time => time >= currentTime);

    if (startIndex < 0) startIndex = 0;

    const indices = Array.from(
        { length: 12 },
        (_, i) => startIndex + i
    ).filter(i => i < hourly.time.length);

    const temperatures = indices.map(i => hourly.temperature_2m[i]);
    const labels = indices.map(i => {
        const time = hourly.time[i];
        return time === currentTime ? "Now" : formatTime(time);
    });

    const rainValues = indices
        .slice(0, 3)
        .map(i => hourly.precipitation_probability?.[i])
        .filter(Number.isFinite);

    $("rainChance").innerHTML = rainValues.length
        ? `${Math.round(Math.max(...rainValues))}<span>%</span>`
        : `--<span>%</span>`;

    const canvas = $("temperatureChart");
    const ctx = canvas.getContext("2d");

    if (temperatureChart) temperatureChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, "rgba(56, 189, 248, 0.25)");
    gradient.addColorStop(1, "rgba(56, 189, 248, 0)");

    temperatureChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                data: temperatures,
                borderColor: "#38bdf8",
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                borderWidth: 2.5,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: "#7dd3fc",
                pointBorderColor: "#0f172a",
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: "index"
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#111b2e",
                    borderColor: "rgba(148,163,184,.2)",
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: context => ` ${Math.round(context.raw)}°C`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                        color: "#8493aa",
                        maxTicksLimit: 6,
                        font: { family: "DM Sans", size: 10 }
                    }
                },
                y: {
                    border: { display: false, dash: [4, 4] },
                    grid: { color: "rgba(148,163,184,.09)" },
                    ticks: {
                        color: "#8493aa",
                        maxTicksLimit: 5,
                        font: { family: "DM Sans", size: 10 },
                        callback: value => `${value}°`
                    }
                }
            }
        }
    });
}

function renderDaylight(weather) {
    const daily = weather.daily;
    const sunrise = daily.sunrise[0];
    const sunset = daily.sunset[0];

    $("sunrise").textContent = formatTime(sunrise);
    $("sunset").textContent = formatTime(sunset);

    if (sunrise && sunset) {
        const start = new Date(sunrise);
        const end = new Date(sunset);
        const minutes = Math.max(0, Math.round((end - start) / 60000));
        $("daylight").textContent = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    } else {
        $("daylight").textContent = "Unavailable";
    }
}

function renderDaily(weather) {
    const daily = weather.daily;

    // Show the next five days, excluding today.
    const days = daily.time.slice(1, 6);
    const maxValues = daily.temperature_2m_max.slice(1, 6);
    const minValues = daily.temperature_2m_min.slice(1, 6);
    const codes = daily.weather_code.slice(1, 6);

    const overallMin = Math.min(...minValues);
    const overallMax = Math.max(...maxValues);
    const range = Math.max(1, overallMax - overallMin);

    forecastList.replaceChildren();

    days.forEach((date, index) => {
        const info = weatherInfo(codes[index], 1);
        const high = Math.round(maxValues[index]);
        const low = Math.round(minValues[index]);

        const row = document.createElement("article");
        row.className = "forecast-row";

        const dayBlock = document.createElement("div");

        const day = document.createElement("p");
        day.className = "forecast-day";
        day.textContent = index === 0 ? "Tomorrow" : formatDate(date, { weekday: "long" });

        const dateLabel = document.createElement("p");
        dateLabel.className = "forecast-date";
        dateLabel.textContent = formatDate(date, { month: "short", day: "numeric" });

        dayBlock.append(day, dateLabel);

        const condition = document.createElement("div");
        condition.className = "forecast-condition";

        const icon = document.createElement("span");
        icon.className = "forecast-icon";
        icon.textContent = info.icon;

        const description = document.createElement("span");
        description.textContent = info.description;

        condition.append(icon, description);

        const temps = document.createElement("div");
        temps.className = "forecast-temps";

        const highEl = document.createElement("span");
        highEl.textContent = `${high}°`;

        const bar = document.createElement("div");
        bar.className = "forecast-bar";

        const barFill = document.createElement("span");
        barFill.style.width = `${Math.max(8, ((high - overallMin) / range) * 100)}%`;
        bar.append(barFill);

        const lowEl = document.createElement("span");
        lowEl.className = "low";
        lowEl.textContent = `${low}°`;

        temps.append(highEl, bar, lowEl);
        row.append(dayBlock, condition, temps);
        forecastList.append(row);
    });
}

searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const city = cityInput.value.trim();
    if (!city) {
        showStatus("Please enter a city name.", true);
        return;
    }

    loadWeather(city);
});

document.querySelectorAll("[data-city]").forEach(button => {
    button.addEventListener("click", () => {
        const city = button.dataset.city;
        cityInput.value = city;
        loadWeather(city);
    });
});

$("locationBtn").addEventListener("click", () => {
    if (!navigator.geolocation) {
        showStatus("Location is not supported by this browser.", true);
        return;
    }

    showStatus("Getting your location...");

    navigator.geolocation.getCurrentPosition(
        async position => {
            try {
                const { latitude, longitude } = position.coords;
                const reverseUrl =
                    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;

                const data = await fetchJson(reverseUrl);
                const place = data.results?.[0];

                if (place) {
                    cityInput.value = place.name;
                    await loadWeather(place.name);
                } else {
                    showStatus("Could not identify this location. Search by city instead.", true);
                }
            } catch {
                showStatus("Could not look up your location. Please search by city.", true);
            }
        },
        error => {
            const message = error.code === 1
                ? "Location permission denied. You can still search for a city."
                : "Unable to get your location. Try searching for a city.";
            showStatus(message, true);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
});

// Initial dashboard weather.
loadWeather("Peshawar");

if (window.lucide) {
    lucide.createIcons();
}
