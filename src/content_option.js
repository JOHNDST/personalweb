import profilePic from './images/pix.png';
import prj1 from './images/test1.png';
import prj44 from './images/test3.png';
import prj3 from './images/test2.png';
import prj66 from './images/test4.png';
import prj5 from './images/test5.png';

const logotext = "Yuxiang Dong";
const meta = {
    title: "Yuxiang Dong",
    description: "Welcome to my personal website.",
};

const introdata = {
    title: "Yuxiang Dong",
    animated: {
        first: "PhD candidate in Architecture",
        second: "Penn State University",
        third: "Designer & Developer",
    },
    description: "Research Keywords: Green infrastructure planning, Storm-water Management, Low impact development, GIS, Multi-objective optimization, Decision-making support tool.",
    your_img_url: profilePic,
};

const dataabout = {
    title: "Research Interests",
    aboutme: "Green infrastructure planning, Storm-water Management, Low impact development, GIS, Multi-objective optimization, Decision-making support tool.",
};
const worktimeline = [{
        jobtitle: "Bachelor of Marketing, Major changed",
        where: "Beijing Forestry University",
        date: "Sep 2015 – Jun 2016",
    },
    {
        jobtitle: "Bachelor of Landscape Gardening, GPA: 92.53 / 100",
        where: "Beijing Forestry University",
        date: "Sep 2016 – Jun 2020",
    },
    {
        jobtitle: "Master of Landscape Architecture, GPA: 4.58 / 5.0",
        where: "Tongji University",
        date: "Sep 2020 – Jun 2023",
    },
    {
        jobtitle: "PhD candidate in Architecture, GPA: 3.97/ 4.0",
        where: "Penn State University",
        date: "Current",
    },
];

const skills = [{
        name: "Python/R",
        value: 65,
    },
    {
        name: "Adobe Illustrator/Photoshop/Indesign",
        value: 95,
    },
    {
        name: "AutoCAD",
        value: 70,
    },
    {
        name: "Rhinoceros/Grasshopper",
        value: 90,
    },
    {
        name: "EPA SWMM/SWAT+",
        value: 85,
    },
    {
        name: "ArcGIS/QGIS",
        value: 85,
    },
    {
        name: "Twinmotion/Lumion",
        value: 95,
    },
    {
        name: "InVEST/Fragstats",
        value: 90,
    },
];

const services = [{
        title: "2020 - 2021 National Natural Science Foundation of China (NSFC) Program",
        description: "Participated in dozens of project discussions, participated in project conceptualization, and wrote the research questions and research review section of the project application. Successfully applied with an acception rate of 15.88%.",
    },
    {
        title: "2020 - 2021 Research Program by Yangtze River Delta City Cluster Intelligent Planning Collaborative Innovation Center",
        description: "Took the lead in the conceptualization of project innovation points, completing project application writing and revision, and participating in six project discussions and two application presentations. Successfully applied for research funding.",
    },
];

const dataportfolio = [
    {
      title: "LID system optimization in Academician Town, Nanyang", // Title of the project
      date: "June 2020", // Publication or completion date
      authors: "Yuxiang Dong", // Can be a single author or a list of authors
      img: prj1, // Image URL
      description: "Design of low impact development system for rain-collecting. ", // Short description or abstract
      route: "/p/proj1_nanyang" ,
    },
    {
      title: "Symbiotic City",
      date: "February 2022",
      authors: "Shoubang Huang, Yuxiang Dong, Yueting Mao",
      img: prj3,
      description: "Garden design for habitat restoration in urban.",
      route: "/p/proj2_symbiotic" ,
      // link: "http://link-to-project2.com",
    },
    {
        title: "Be-living: how to interpret ecological \"Fangsheng\" to Buddhists",
        date: "February 2021",
        authors: "Yuxiang Dong, Ruilin Zhu,  Ai Liu,  Shuaiqi Xia, Luqiyao Chen",
        img: prj44,
        description: "Promote animal release in an eco-friendly way.",
        route: "/p/proj3_fangsheng",
        // link: "https://www.asla.org/2021studentawards/3324.html",
      },
      {
        title: "Firewatch Skyscraper",
        date: "August 2020",
        authors: "Yuxiang Dong, Shoubang Huang, Yenan Xiao,Yu Huang",
        img: prj66,
        description: "Construction solution to wildfires in Australia.",
        route: "/p/proj4_australia" ,
      },
      {
        title: "Recycling Station in the Pear Orchard",
        date: "August 2019",
        authors: "Chongyan Chen, Yuxiang Dong, Xinge Zhang, Yuehan Liu, Hanlin Zhang, Chao Zhou, Yilun Yang; Koriki Yuta, Morimoto Tenki, Matsumoto Daiki, Fei Xu, Siyun Rao, Jianghui Ge, Sugiyama Eichi",
        img: prj5,
        description: "Design to activate the countryside",
        route: "/p/proj5_siyang" ,
      },
    // Add more portfolio items as needed
  ];

const researchdata = [
    {
      title: "Identifying critical landscape patterns for simultaneous provision of multiple ecosystem services – A case study in the central district of Wuhu City, China",
      date: "Ecological Indicators, 2024, 11380",
      authors: "Yuxiang Dong, Song Liu, Xinsheng Pei, Ying Wang",
      abstract: "Our research develops a method to assess the impact of landscape patterns on the provision of multiple ecosystem services (ESs), highlighting the importance of understanding ES trade-offs for land management. By applying production possibility frontier and Pareto ranks to Wuhu City's central district, we identify key landscape metrics that promote diverse ESs and offer land-use planning recommendations to optimize ecological resilience and sustainability.",
      img: "https://ars.els-cdn.com/content/image/1-s2.0-S1470160X23015224-gr2_lrg.jpg", // Replace with the path to your image
      link: "https://www.sciencedirect.com/science/article/pii/S1470160X23015224#f0020"
    },
    {
      title: "The Multi-Objective Optimization of Low-Impact Development Facilities in Shallow Mountainous Areas Using Genetic Algorithms",
      date: "Water, 2022, 14(19), 2986",
      authors: "Huiyi Sun, Yuxiang Dong, Yue Lai, Xuanyin Li, Xiaoyu Ge, Chensong Lin",
      abstract: "This study employs a genetic algorithm (NSGA-II) to optimize the layout of Low-Impact Development (LID) facilities for urban rainfall and flooding control, specifically addressing the unique challenges of shallow mountainous areas. Utilizing multiple objectives and decision-making methods like EWM-TOPSIS and VCWM-TOPSIS, the research successfully demonstrates a more scientific and efficient approach to LID placement in sponge city construction compared to traditional methods.",
      img: "https://www.mdpi.com/water/water-14-02986/article_deploy/html/images/water-14-02986-g004.png", // Replace with the path to your image
      link: "https://www.mdpi.com/2073-4441/14/19/2986"
    },
    {
        title: "Spatio-temporal evolution and driving factors of ecosystem services in Chengdu-Chongqing urban agglomeration of southwestern China based on GWR model",
        date: "Journal of Beijing Forestry University, 2020, 42(11), 118-129",
        authors: "Ming Shao, Yuxiang Dong, Chensong Lin",
        abstract: "This study introduces a multi-objective optimization approach for designing rainwater harvesting green spaces using Grasshopper, incorporating stormwater control effectiveness and construction cost as objectives and employing the NSGA-II algorithm to optimize the scale of LID facilities. Applied to a project in Nanyang Academician Town and contrasted with traditional methods, the research reveals that increasing permeable pavements and bio-retention cells enhances the cost-effectiveness of LID facilities, offering new insights for future sustainable urban design.",
        img: "", // Replace with the path to your image
        link: "http://j.bjfu.edu.cn/en/article/pdf/preview/10.12171/j.1000-1522.20200217.pdf"
    },
    // Add more research items as needed
  ];
  

const contactConfig = {
    YOUR_EMAIL: "john.d.1037603327@gmail.com",
    YOUR_FONE: "The box is currently not working... send me an email directly :)",
    description: "Feel free to reach out to me for collaborations, research discussions, or any inquiries related to my work. I'm always open to connecting with fellow researchers, professionals, and enthusiasts in the field of landscape architecture and environmental planning.",
    // creat an emailjs.com account 
    // check out this tutorial https://www.emailjs.com/docs/examples/reactjs/
    YOUR_SERVICE_ID: "service_v7x3zyt",
    YOUR_TEMPLATE_ID: "template_ffxxbup",
    YOUR_USER_ID: "eBv5PfevswR6E5_8C",
};

const socialprofils = {
    github: "https://github.com/JOHNDST",
    google: "https://scholar.google.com/citations?hl=en&user=rsgefw8AAAAJ",
    linkedin: "https://dub.sh/yxli",
    // twitter: "https://twitter.com",
};
export {
    meta,
    dataabout,
    dataportfolio,
    worktimeline,
    skills,
    services,
    introdata,
    contactConfig,
    socialprofils,
    logotext,
    researchdata,
};