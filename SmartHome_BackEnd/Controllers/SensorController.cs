using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartHome_BackEnd.Data;
using SmartHome_BackEnd.Entities;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace SmartHome_BackEnd.Controllers
{
    [Route("api/sensor")]
    [ApiController]
    public class SensorController : ControllerBase
    {
        private readonly DataContext _context;
        public SensorController(DataContext context)
        {
            this._context = context;
        }

        // GET api/<ValuesController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<ValuesController>
        [HttpPost]
        public async Task<IActionResult> PostSensorData([FromBody] Sensor sensorData)
        {
            Console.WriteLine($"Temperature: {sensorData.Temperature}, Humidity: {sensorData.Humidity}");
            if (sensorData == null)
            {
                return BadRequest("Sensor data is null.");
            }
            
            try
            {
                _context.Sensors.Add(sensorData); // Assuming Sensors is the DbSet<SensorData>
                await _context.SaveChangesAsync();

                return Ok(new { message = "Sensor data saved successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // GET api/<ValuesController>/sensor
        [HttpGet]
        public async Task<IActionResult> GetSensorData()
        {
            var sensorDataList =await _context.Sensors.ToListAsync();
            return Ok(sensorDataList);
        }

        // PUT api/<ValuesController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<ValuesController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {

        }
        [HttpDelete]
        public async Task<IActionResult> DeleteAllSensor()
        {
            var sensor = await _context.Sensors.ToListAsync();
            if(!sensor.Any())
            {
                return NoContent();
            }
            _context.Sensors.RemoveRange(sensor);
            await _context.SaveChangesAsync();
            return NoContent();

        }
    }
}
