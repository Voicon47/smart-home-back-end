namespace SmartHome_BackEnd.Entities
{
    public class Sensor
    {
        public Sensor() { }
        public Sensor(float temperature,float humidity) 
        { 
            Temperature = temperature;
            Humidity = humidity;
        }
        public long Id { get; set; }
        public float Temperature { get; set; }
        public float Humidity { get; set; }
    }
}
