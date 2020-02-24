import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import * as Chart from 'chart.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  title = 'MCQApp';

  listOfCategories = new Set<String>(); // list of categories
  
  /* boolean variables to decide the components to be shown on the html page */
  showQuestions = false;
  showCategories = false;
  showFinish = false;
  showNext = false;
  showEndScreen = false;
  showGraph = false;
  showBack = false;
  isAnswered = false;
  showHomeButton = false;
  showMainScreen = true;
  thankYouScreen = false;

  /* maps */
  idMapping = new Map(); // stores question ID with its correct answer ID
  questionToIdMapping = new Map(); // stores question text with its ID
  answerToIdMapping = new Map(); // stores answer text with its ID
  catToQuestMapping = new Map(); // stores category along with the corresponding list of questions
  selectedAns = new Map(); // stores the questions and the answers selected by user
  questToAnsMapping = new Map(); // stores question with answer options
  scoreToCategoryMapping = new Map(); // stores score history as per category

  listOfQuestions = [];
  listOfAnswers = [];
  
  totalQues = 0;
  index = 0;
  score = 0;
  
  quest: any;
  myChart: any;

  category: string;
  answ: string;

  constructor(private http: HttpClient) {

  }

  @ViewChild('bar') bar: ElementRef;
  
  // called when the page is loaded initially
  ngOnInit() {
    // call the server side function to get mcq data
    this.http.get("http://localhost:3300/getMax").subscribe(data => {
        const len = Object.keys(data).length;
        var allQuests = [];
        for(var i = 0; i < len; i++) {
          var list = [];
          this.listOfCategories.add(data[i]["category"]);

          if(this.catToQuestMapping.has(data[i]["category"])) {
            list =  this.catToQuestMapping.get(data[i]["category"]);
          }
          
          // unescape the unwanted characters and store data in appropriate maps or lists 
          list.push((((data[i]["question_text"].replace(/<\/?[^>]+>/gi, '')).replace(/&nbsp;/gi,'')).replace(/&ndash;/gi,'-')).replace(/&mdash;/gi,'--'));
          allQuests.push((((data[i]["question_text"].replace(/<\/?[^>]+>/gi, '')).replace(/&nbsp;/gi,'')).replace(/&ndash;/gi,'-')).replace(/&mdash;/gi,'--'));
          this.catToQuestMapping.set(data[i]["category"], list);
          this.questionToIdMapping.set((((data[i]["question_text"].replace(/<\/?[^>]+>/gi, '')).replace(/&nbsp;/gi,'')).replace(/&ndash;/gi,'-')).replace(/&mdash;/gi,'--'), data[i]["id"]);
          this.idMapping.set(data[i]["id"], data[i]["correct_answer_id"]);

          var answers = new Array();
          answers = data[i]["answers"];
          this.questToAnsMapping.set((((data[i]["question_text"].replace(/<\/?[^>]+>/gi, '')).replace(/&nbsp;/gi,'')).replace(/&ndash;/gi,'-')).replace(/&mdash;/gi,'--'), answers);

          for(var j = 0; j < answers.length; j++) {
            this.answerToIdMapping.set(answers[j]["id"], answers[j]["answer_text"].replace(/&ndash;/gi,'-'));
          }
          this.catToQuestMapping.set("All", allQuests);
        }
    })
  }

  // displays the category screen of app
  showCategoryScreen(val: any) {
    this.showMainScreen = false;
    this.showCategories = true;
  }

  // displays the question as per selected category
  displayQuestions(val: any, value: any) {
  
    // destroy the displayed chart 
    if(this.myChart != undefined) {
      this.myChart.destroy();
    }  

    this.category = value;
    this.listOfQuestions = this.catToQuestMapping.get(value);
    this.totalQues = this.listOfQuestions.length;
    this.quest = this.listOfQuestions[0];
    var ans = this.questToAnsMapping.get(this.quest);
    for(var i = 0; i < ans.length; i++) {
      this.listOfAnswers.push(ans[i]["answer_text"].replace(/&ndash;/gi,'-'));
    }
    
    // decide which sections are to be displayed or hidden
    this.showQuestions = true;
    this.showCategories = false;
    this.showMainScreen = false;
    this.showNext = true;
    this.index++;
  }

  // display the next question
  showNextQuestion(val:any) {
    this.showBack = true;
    this.quest = this.listOfQuestions[this.index];
    var ans = this.questToAnsMapping.get(this.quest);
    this.listOfAnswers = [];

    for(var i = 0; i < ans.length; i++) {
      this.listOfAnswers.push(ans[i]["answer_text"].replace(/&ndash;/gi,'-'));
    }

    if(this.index == this.listOfQuestions.length-1) {
      this.showFinish = true;
      this.showNext = false;
    }

    // check if the question was previously answered by the user
    if(this.selectedAns.has(this.quest)) {
      this.isAnswered = true;
      this.answ = this.selectedAns.get(this.quest);
    }
    this.index++;
  }

  // display the previous question
  showPrevQuestion(val: any) {
    this.index = this.index-2;
    this.quest = this.listOfQuestions[this.index];
    var ans = this.questToAnsMapping.get(this.quest);
    this.listOfAnswers = [];

    for(var i = 0; i < ans.length; i++) {
      this.listOfAnswers.push(ans[i]["answer_text"].replace(/&ndash;/gi,'-'));
    }

    if(this.index == this.listOfQuestions.length-1) {
      this.showFinish = true;
      this.showNext = false;
    }

    if(this.selectedAns.has(this.quest)) {
      this.isAnswered = true;
      this.answ = this.selectedAns.get(this.quest);
    }
    this.index++;

    if(this.index <= 1) {
      this.showBack = false;
    }
  }

  // stores answers of each question when user selects the radio button
  storeAnswers(val: any, que: string) {
    this.selectedAns.set(que, val.target.value);
  }

  showScore(val: any) {
    // decide which sections are to be displayed or hidden
    this.showBack = false;
    this.showMainScreen = false;
    this.showCategories = false;
    this.showFinish = false;
    this.showNext = false;
    this.showQuestions = false;
    this.showEndScreen = true;

    // iterate through the selected answers list and calculate the score
    this.selectedAns.forEach((value: string, key: string) => {
      var correctAnsID = this.questionToIdMapping.get(key);
      var correctId = this.idMapping.get(correctAnsID);
      var correctAns = this.answerToIdMapping.get(correctId);
      
      if(correctAns == value) {
        this.score++;
      }
    });
    this.selectedAns = new Map();

    // store the score in localStorage to maintain the history of scores as per category
    if(this.score == 0) {
      localStorage.setItem(this.category, "0");
    }
    else {
      localStorage.setItem(this.category, String(this.score));
    }
    this.index = 0;
  }

  // displays the home screen
  showHomeScreen(val: any) {
    // decide which sections are to be displayed or hidden
    this.showMainScreen = false;
    this.showCategories = true;
    this.showEndScreen = false;
    this.showGraph = false;
    this.showQuestions = false;
    this.showBack = false;
    this.showHomeButton = false;
    this.isAnswered = false;

    this.answ = "";
    this.listOfAnswers = [];
    this.listOfQuestions = [];
    this.index = 0;

    if(this.myChart != undefined) {
      this.myChart.destroy();
    }
  }

  // display the score history in bar garph format
  showScoreGraph(val: any) {
    var values = [];
    
    // decide which sections are to be displayed or hidden
    this.showGraph = true;
    this.showBack = false;
    this.showCategories = false;
    this.showHomeButton = true;
    this.showEndScreen = false;

    for(var i = 0; i < localStorage.length; i++) {
      this.scoreToCategoryMapping.set(localStorage.key(i), localStorage.getItem(localStorage.key(i)).split("#")[0][0]);
    }

    if(this.scoreToCategoryMapping.has('Main Point Questions')) {
      values.push(this.scoreToCategoryMapping.get('Main Point Questions'));
    }
    else {
      values.push(0);
    }
    if(this.scoreToCategoryMapping.has('Argument Structure Questions')) {
      values.push(this.scoreToCategoryMapping.get('Argument Structure Questions'));
    }
    else {
      values.push(0);
    }
    if(this.scoreToCategoryMapping.has('All')) {
      values.push(this.scoreToCategoryMapping.get('All'));
    }
    else {
      values.push(0);
    }
    
    var ctx = this.bar.nativeElement;
    this.myChart = new Chart(ctx, {
      responsive: true,
      type: 'bar',
      data: {
          labels: ['Main Point Questions', 'Argument Structure Questions', 'All'],
          datasets: [{
              label: 'Score vs Category',
              data: values,
              backgroundColor: '#5e3b70',
              borderColor: '#5e3b70',
              borderWidth: 0.2,
              fillOpacity: .3
          }]
      },
      options: {
          scales: {
              yAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: 'Score'
                },
                ticks: {
                  beginAtZero: false
                }
              }],
              xAxes: [{
                barThickness: 70,
                scaleLabel: {
                  display: true,
                  labelString: 'Category'
                }
              }]
          }
      }
    });
  }

  // displays the first question as per the selected category
  restartQuiz(val: any) {
    this.isAnswered = false;
    this.showEndScreen = false;

    this.index = 0;
    this.answ = "";
    this.listOfAnswers = [];
    this.listOfQuestions = [];

    this.displayQuestions(" ", this.category);
  }

  // displays end screen
  showThankYouScreen(val: any) {
    this.thankYouScreen = true;
    this.showBack = false;
    this.showMainScreen = false;
    this.showCategories = false;
    this.showFinish = false;
    this.showNext = false;
    this.showQuestions = false;
    this.showEndScreen = false;
  }

  // displays welcome screen
  showFirstScreen(val: any) {
    this.showCategories = false;
    this.showMainScreen = true;
    this.thankYouScreen = false;
  }
}
