import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  summaryCards = [
    { label: 'Registrations', value: '1,450', note: 'Active learners this term' },
    { label: 'Courses', value: '17', note: 'Published in catalogue' },
    { label: 'Reviews', value: '1,400', note: 'Feedback collected' },
  ];

  ngOnInit(): void {
    this.chartView();
  }

  chartView(): void {
    const data = [
      { year: 2010, count: 40 },
      { year: 2011, count: 169 },
      { year: 2012, count: 82 },
      { year: 2014, count: 150 },
      { year: 2015, count: 220 },
      { year: 2016, count: 400 }
    ];

    const labels = data.map(row => row.year);
    const values = data.map(row => row.count);

    new Chart(document.getElementById('myChart1') as HTMLCanvasElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Enrollment by year',
          data: values,
          borderColor: '#0f766e',
          backgroundColor: 'rgba(15, 118, 110, 0.15)',
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(11,31,51,0.06)' } }
        }
      }
    });

    new Chart(document.getElementById('myChart2') as HTMLCanvasElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Marks by year',
          data: values,
          backgroundColor: 'rgba(11, 31, 51, 0.78)',
          borderRadius: 8
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(11,31,51,0.06)' } }
        }
      }
    });
  }
}
