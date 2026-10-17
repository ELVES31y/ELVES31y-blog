-- 把文章 / 说说里被误存成字面 "\n" 的换行符，替换成真正的换行（char(10)）
UPDATE posts   SET content = replace(content, '\n', char(10));
UPDATE moments SET content = replace(content, '\n', char(10));
