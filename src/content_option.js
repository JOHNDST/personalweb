import profilePic from './images/pix.png';
import prj1 from './images/test1.png';
import prj44 from './images/test3.png';
import prj3 from './images/test2.png';
import prj66 from './images/test4.png';
import prj5 from './images/test5.png';
import ws from './images/P7.png';
import syw from './images/syw.png';
import garlic from './images/garlic.png';
import fudao from './images/fudao.jpg';
import dujuan from './images/dujuan.jpg';
import chongqing from './images/chongqing.jpg';

const logotext = "Yuxiang Dong ['Dom']";
const meta = {
    title: "Yuxiang Dong",
    description: "Welcome to my personal website.",
};

const introdata = {
    title: "Yuxiang Dong ['Dom']",
    animated: {
        first: "PhD candidate in Architecture",
        second: "Penn State University",
        third: "PhD Minor in Operations Research",
    },
    description: "Research Focus:Decision Support in Landscape and Urban Systems.",
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
      title: "Exterior Design and LID system of Rose Scientific Research & Industrial Park", // Title of the project
      date: "June 2020", // Publication or completion date
      authors: "Yuxiang Dong", // Can be a single author or a list of authors
      img: prj1, // Image URL
      description: "Design of low impact development system for rain-collecting. ", // Short description or abstract
      route: "/p/proj1_nanyang" ,
      tag: "#park_design",
      award: "Award of Excellence under Flood & Water Management category, 2024 IFLA AAPME Awards	",
    },
    {
      title: "The Symbiotic City",
      date: "February 2022",
      authors: "Shoubang Huang, Yuxiang Dong, Yueting Mao, Xiaohui Sun, Yuting Qi, Xifang Chen",
      img: prj3,
      description: "Garden design for habitat restoration in urban.",
      route: "/p/proj2_symbiotic" ,
      tag: "#garden_design; #planting_design",
      model: "/content/proj2_symbiotic-assets/symbiotic.glb",
      award: "Grand Gold Award, 2021 “Greater Bay Area” Flower Show Competition",
      // link: "http://link-to-project2.com",
    },
    {
        title: "Be-living: how to interpret ecological \"Fangsheng\" to Buddhists",
        date: "February 2021",
        authors: "Yuxiang Dong, Ruilin Zhu,  Ai Liu,  Shuaiqi Xia, Luqiyao Chen",
        img: prj44,
        description: "Promote animal release in an eco-friendly way.",
        route: "/p/proj3_fangsheng",
        tag: "#graphic_design; #ecological_planning",
        award: "Honor Award in Communication, 2021 ASLA Student Awards",
        // link: "https://www.asla.org/2021studentawards/3324.html",
      },
      {
        title: "Firewatch Skyscraper",
        date: "August 2020",
        authors: "Yuxiang Dong, Shoubang Huang, Yenan Xiao,Yu Huang",
        img: prj66,
        description: "Construction solution to wildfires in Australia.",
        route: "/p/proj4_australia" ,
        tag: "#architectural_design",
        award: "Editors’ Choice, 2020 eVolo Skyscraper Competition"
      },
      {
        title: "Recycling Station in the Pear Orchard",
        date: "August 2019",
        authors: "Chongyan Chen, Yuxiang Dong, Xinge Zhang, Yuehan Liu, Hanlin Zhang, Chao Zhou, Yilun Yang; Koriki Yuta, Morimoto Tenki, Matsumoto Daiki, Fei Xu, Siyun Rao, Jianghui Ge, Sugiyama Eichi",
        img: prj5,
        description: "Design to activate the countryside",
        route: "/p/proj5_siyang" ,
        tag: "#architectural_design",
        model: "/content/proj5_siyang-assets/siyang.glb",
        award:"Second Prize, 2019 UIA-CBC International Universities Competitive Workshop",
      },
            {
        title: "MICSON Roof Garden",
        date: "August 2019",
        authors: "Yuxiang Dong",
        img: ws,
        description: "A Green Roof Design for an Office Building",
        route: "/p/proj6_weisong" ,
        tag: "#garden_design",
      },
                  {
        title: "Labbay Entrance Open Space",
        date: "November 2022",
        authors: "Yuxiang Dong",
        img: syw,
        description: "A Green Roof Design for an Office Building",
        route: "/p/proj7_shengyanwan" ,
        tag: "#open_space_design",
        model: "/content/proj7_shengyanwan/sculpture.glb",
      },
                        {
        title: "Garlic Route",
        date: "February 2021",
        authors: "Yuxiang Dong, Luqiyao Chen, Yuhan Cui",
        img: garlic,
        description: "A bamboo structure design",
        route: "/p/proj9_garlic" ,
        tag: "#structure_design",
        model: "/content/proj9_garlic/garlic.glb",
      },
        {
        title: "Wetland of Breathe",
        date: "April 2021",
        authors: "Yuxiang Dong, Yaocheng Li, Zhiwei Liu",
        img: fudao,
        description: "Floating Wetland Design for Water Purification",
        route: "/p/proj10_fudao" ,
        tag: "#structure_design; #planting_design",
        model: "/content/proj10_fudao/fudao.glb",
        award: "Excellence Award, 2021 ‘Future Garden Designer’ Shanghai International Flower Show Competition",
      },
              {
        title: "Rhododendron & Revolution",
        date: "February 2021",
        authors: "Yuxiang Dong, Yaocheng Li, Zhiwei Liu",
        img: dujuan,
        description: "A garden design for rhododendron exhibition",
        route: "/p/proj11_dujuan" ,
        tag: "#planting_design; #garden_design",
        model: "/content/proj11_dujuan/dujuan.glb",
      },
      {
        title: "Park City Plan: Industrial Urban Renewal in Chongqing",
        date: "October 2020",
        authors: "Yuxiang Dong, Luqiyao Chen, Yuhan Cui, Yinxin Liang",
        img: chongqing,
        description: "Urban Planning for Industrial City Renewal in Chongqing",
        route: "/p/proj12_chongqing" ,
        tag: "#conceptual_planning"
      },
    // Add more portfolio items as needed
  ];

const researchdata = [
    {
        title: "Balancing traffic efficiency and ecosystem services in road network planning: A spatial multi-objective optimization approach",
        date: "Journal of Environmental Management, 2025",
        authors: "Yuxiang Dong, Yuxin Ding, Hongyu Chen, Chensong Lin, Longfeng Wu",
        abstract: "This study introduces an integrated model combining InVEST and NetworkX to optimize road network design before construction. Applied to Mengyang, Xishuangbanna, the model identifies Pareto-optimal road schemes and reveals a trade-off between global efficiency (GE) and habitat quality (HQ).",
        img: "https://ars.els-cdn.com/content/image/1-s2.0-S0301479725X00207-cov200h.gif", // Replace with the path to your image
        link: "https://www.sciencedirect.com/science/article/pii/S0301479725037818"
      },
    {
        title: "Spatially Explicit Optimization of Urban Green Infrastructure for Multiple Ecosystem Services Using Deep Learning Surrogates",
        date: "Environmental Modelling & Software, 2025",
        authors: "Yuxiang Dong, Anirudh Subramanyam, Hong Wu",
        abstract: "This work presents a deep learning (DL)-based optimization framework that replaces InVEST modules with UNet and Attention UNet surrogates. UNet demonstrated high accuracy (R2 > 0.9 on test data) and reduced optimization time by 95.5 % compared to direct InVEST runs while producing near-identical Pareto-optimal solutions.",
        img: "https://ars.els-cdn.com/content/image/X13648152.jpg", // Replace with the path to your image
        link: "https://doi.org/10.1016/j.envsoft.2025.106758"
      },
    {
        title: "Spatially explicit multi-objective optimization tool for green infrastructure planning based on InVEST and NSGA-II towards multifunctionality",
        date: "Land Use Policy, 2024, 107465",
        authors: "Yuxiang Dong, Song Liu, Xinsheng Pei, Ying Wang",
        abstract: "This study integrates the InVEST model with NSGA-II to develop a spatially explicit multi-objective optimization framework for multifunctional GI planning in Wuhu City, demonstrating significant improvements in habitat quality, crop production, and runoff reduction while revealing key synergies, trade-offs, and spatial patterns to guide sustainable urban development.",
        img: "https://ars.els-cdn.com/content/image/1-s2.0-S0264837724X00125-cov200h.gif", // Replace with the path to your image
        link: "https://www.sciencedirect.com/science/article/pii/S0264837724004186"
      },
    {
        title: "Optimized green infrastructure planning at the city scale based on an interpretable machine learning model and multi-objective optimization algorithm: A case study of central Beijing, China",
        date: "Landscape and Urban Planning, 2024, 105191",
        authors: "Hongyu Chen, Yuxiang Dong, Hao Li, Shuangzhi Tian, Longfeng Wu, jinlong Li, Chensong Lin",
        abstract: "This study integrates an interpretable SVM-SHAP model with NSGA-II to optimize green infrastructure planning for urban flood mitigation in Beijing, revealing the complementary roles of GI and grey infrastructure, identifying high-risk urban–rural transition zones, and demonstrating that dispersed small-scale GI implementation offers the best investment efficiency.",
        img: "https://ars.els-cdn.com/content/image/X01692046.jpg", // Replace with the path to your image
        link: "https://www.sciencedirect.com/science/article/pii/S0169204624001907"
      },
    {
      title: "Identifying critical landscape patterns for simultaneous provision of multiple ecosystem services – A case study in the central district of Wuhu City, China",
      date: "Ecological Indicators, 2024, 11380",
      authors: "Yuxiang Dong, Song Liu, Xinsheng Pei, Ying Wang",
      abstract: "Our research develops a method to assess the impact of landscape patterns on the provision of multiple ecosystem services (ESs), highlighting the importance of understanding ES trade-offs for land management. By applying production possibility frontier and Pareto ranks to Wuhu City's central district, we identify key landscape metrics that promote diverse ESs and offer land-use planning recommendations to optimize ecological resilience and sustainability.",
      img: "https://ars.els-cdn.com/content/image/1-s2.0-S1470160X23X00120-cov200h.gif", // Replace with the path to your image
      link: "https://www.sciencedirect.com/science/article/pii/S1470160X23015224#f0020"
    },
    {
      title: "The Multi-Objective Optimization of Low-Impact Development Facilities in Shallow Mountainous Areas Using Genetic Algorithms",
      date: "Water, 2022, 14(19), 2986",
      authors: "Huiyi Sun, Yuxiang Dong, Yue Lai, Xuanyin Li, Xiaoyu Ge, Chensong Lin",
      abstract: "This study employs a genetic algorithm (NSGA-II) to optimize the layout of Low-Impact Development (LID) facilities for urban rainfall and flooding control, specifically addressing the unique challenges of shallow mountainous areas. Utilizing multiple objectives and decision-making methods like EWM-TOPSIS and VCWM-TOPSIS, the research successfully demonstrates a more scientific and efficient approach to LID placement in sponge city construction compared to traditional methods.",
      img: "https://media.licdn.com/dms/image/v2/C560BAQH-vi43Dc2cgQ/company-logo_200_200/company-logo_200_200/0/1631501080105?e=2147483647&v=beta&t=F5Ypm8Z-aV10MXDF1Yz2AQrtI0KnEn2aHE8AvLbviuw", // Replace with the path to your image
      link: "https://www.mdpi.com/2073-4441/14/19/2986"
    },
    {
        title: "Spatio-temporal evolution and driving factors of ecosystem services in Chengdu-Chongqing urban agglomeration of southwestern China based on GWR model",
        date: "Journal of Beijing Forestry University, 2020, 42(11), 118-129",
        authors: "Ming Shao, Yuxiang Dong, Chensong Lin",
        abstract: "",
        img: "http://j.bjfu.edu.cn/fileBJLYDXXB/journal/article/bjlydxxb/2025/10/74d5dcf8-488c-4ddd-a8ef-835ec4dcfb02.jpg", // Replace with the path to your image
        link: "https://www.scopus.com/pages/publications/85097144113"
    },
        {
        title: "Research on optimization method for low impact development (LID) controls distribution of greenspace in shallow mountain based on D8 and NSGA-Ⅱ algorithm",
        date: "Journal of Beijing Forestry University, 2022, 44(9), 116-126",
        authors: "Hongyu Chen, Yuxiang Dong, Chensong Lin",
        abstract: "Based on the characteristics of greenspace planning and design and runoff in shallow mountain area, the study formed a platform for optimal distribution of LID controls by D8 and NSGA-Ⅱ coupled algorithm, which realized spatial quantitative optimization of the type and scale of LID controls based on collaborative optimization of runoff control and cost. In addition, Westmount Country Park  in  Shijiazhuang  City  was  taken  as  the  experimental  object  to  verify  the  feasibility  of  the  method.",
        img: "http://j.bjfu.edu.cn/fileBJLYDXXB/journal/article/bjlydxxb/2025/10/74d5dcf8-488c-4ddd-a8ef-835ec4dcfb02.jpg", // Replace with the path to your image
        link: "https://www.scopus.com/pages/publications/85140056596"
    },
    {
        title: "Optimal Calculation Method of Size of LID Facilities for Rainwater Harvesting Green Space Based on NSGA-II Algorithm and Application: A Case Study of Nanyang Academician Town",
        date: "Landscape Architecture, 2020, 27(12), 92-97",
        authors: "Hongyu Chen, Yuxiang Dong, Chensong Lin, Xiong Li",
        abstract: "This study introduces a multi-objective optimization approach for designing rainwater harvesting green spaces using Grasshopper, incorporating stormwater control effectiveness and construction cost as objectives and employing the NSGA-II algorithm to optimize the scale of LID facilities. Applied to a project in Nanyang Academician Town and contrasted with traditional methods, the research reveals that increasing permeable pavements and bio-retention cells enhances the cost-effectiveness of LID facilities, offering new insights for future sustainable urban design.",
        img: "http://www.lalavision.com/style/images/custom/%E5%BA%95%E9%83%A8logo.png", // Replace with the path to your image
        link: "http://www.lalavision.com/en/article/pdf/preview/10.14085/j.fjyl.2020.12.0092.06.pdf"
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